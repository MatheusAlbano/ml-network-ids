"""
Converte uma captura de rede (.pcap ou .pcapng, por exemplo salva pelo
Wireshark) em um CSV no formato do UNSW-NB15, pronto para o upload em
lote do sistema (tela "Análise em Lote").

Cada linha do CSV é uma conexão (fluxo) da captura. As 34 colunas que o
modelo usa são calculadas a partir dos pacotes seguindo as definições
do UNSW-NB15 (que foram geradas pelas ferramentas Argus e Bro). As
colunas extras no começo (origem, destino, ...) servem só para você
saber qual conexão é qual; o sistema as ignora.

Uso:
    pip install scapy
    python pcap_para_csv.py captura.pcapng
    python pcap_para_csv.py captura.pcapng -o conexoes.csv --json

Limitações (importante para a banca): o UNSW-NB15 foi gerado em 2015
num laboratório fechado, e algumas colunas dependem desse ambiente
(principalmente sttl/dttl, o TTL dos pacotes, e as contagens ct_*).
Os valores calculados aqui seguem a mesma definição, mas o tráfego de
uma rede real tem TTLs e padrões diferentes dos do laboratório.
"""

import argparse
import csv
import json
import statistics
import sys
from pathlib import Path

try:
    from scapy.all import IP, IPv6, TCP, UDP, ICMP, ARP, Raw, PcapReader
except ImportError:
    sys.exit("Instale o scapy antes: pip install scapy")

# Colunas na mesma ordem do artifacts/input_schema.json
FEATURES = [
    "dur", "proto", "service", "state", "rate", "sttl", "dttl", "sload",
    "dload", "sloss", "dloss", "sinpkt", "dinpkt", "sjit", "djit", "swin",
    "stcpb", "dtcpb", "tcprtt", "ackdat", "smean", "dmean", "trans_depth",
    "response_body_len", "ct_srv_src", "ct_state_ttl", "ct_dst_ltm",
    "ct_src_dport_ltm", "ct_dst_sport_ltm", "ct_dst_src_ltm", "ct_ftp_cmd",
    "ct_flw_http_mthd", "ct_src_ltm", "is_sm_ips_ports",
]
ID_COLUMNS = ["conexao", "inicio_s", "origem", "destino", "pacotes"]

# Serviços que o UNSW-NB15 reconhece, pela porta de destino
SERVICE_BY_PORT = {
    20: "ftp-data", 21: "ftp", 22: "ssh", 25: "smtp", 53: "dns",
    67: "dhcp", 68: "dhcp", 80: "http", 110: "pop3", 161: "snmp",
    194: "irc", 443: "ssl", 587: "smtp", 1812: "radius", 1813: "radius",
    6667: "irc", 8080: "http",
}
PROTO_NAMES = {6: "tcp", 17: "udp", 1: "icmp", 58: "ipv6-icmp", 89: "ospf"}
# Protocolos fora dos mais frequentes viram "other", como no treino
TOP_PROTO = {"tcp", "udp", "unas", "arp", "ospf"}

HTTP_METHODS = (b"GET ", b"POST ", b"PUT ", b"HEAD ", b"DELETE ", b"OPTIONS ", b"PATCH ")
FTP_COMMANDS = (b"USER", b"PASS", b"RETR", b"STOR", b"LIST", b"CWD", b"PWD", b"QUIT", b"PORT", b"PASV")

# Fluxo UDP/ICMP sem pacotes por este tempo é encerrado (o Argus usa 60 s)
IDLE_TIMEOUT = 60.0
WINDOW = 100  # as colunas ct_* olham as últimas 100 conexões


class Flow:
    def __init__(self, key, src, dst, sport, dport, proto, ts):
        self.key = key
        self.src, self.dst, self.sport, self.dport = src, dst, sport, dport
        self.proto = proto
        self.start = self.last = ts
        self.pkts = {"s": [], "d": []}  # (timestamp, bytes)
        self.ttl = {"s": None, "d": None}
        self.win = {"s": 0, "d": 0}
        self.isn = {"s": 0, "d": 0}
        self.seen_seq = {"s": set(), "d": set()}
        self.loss = {"s": 0, "d": 0}
        self.syn_ts = self.synack_ts = self.ack_ts = None
        self.fin = self.rst = False
        self.http_requests = 0
        self.response_body_len = 0
        self.ftp_cmds = 0
        self.closed = False

    def add(self, direction, ts, size, ttl, tcp, payload):
        self.last = ts
        self.pkts[direction].append((ts, size))
        if self.ttl[direction] is None:
            self.ttl[direction] = ttl
        if tcp is None:
            return
        flags = int(tcp.flags)
        syn, ack, fin, rst = flags & 0x02, flags & 0x10, flags & 0x01, flags & 0x04
        if syn and not ack and self.syn_ts is None:
            self.syn_ts = ts
            self.isn["s"], self.win["s"] = tcp.seq, tcp.window
        elif syn and ack and self.synack_ts is None:
            self.synack_ts = ts
            self.isn["d"], self.win["d"] = tcp.seq, tcp.window
        elif ack and self.synack_ts is not None and self.ack_ts is None and direction == "s":
            self.ack_ts = ts
        if fin:
            self.fin = True
        if rst:
            self.rst = True
        if payload:
            # Mesmo número de sequência com dados de novo = retransmissão
            if tcp.seq in self.seen_seq[direction]:
                self.loss[direction] += 1
            self.seen_seq[direction].add(tcp.seq)
            if direction == "s" and payload.startswith(HTTP_METHODS):
                self.http_requests += 1
            if direction == "s" and payload[:4].upper().startswith(FTP_COMMANDS):
                self.ftp_cmds += 1
            if direction == "d" and payload.startswith(b"HTTP/"):
                head, _, body = payload.partition(b"\r\n\r\n")
                for line in head.split(b"\r\n"):
                    if line.lower().startswith(b"content-length:"):
                        try:
                            self.response_body_len += int(line.split(b":", 1)[1])
                        except ValueError:
                            pass
                        break
                else:
                    self.response_body_len += len(body)


def _direction_stats(pkts):
    """Bytes, média, intervalo médio entre pacotes e jitter (em ms)."""
    count = len(pkts)
    total = sum(size for _, size in pkts)
    gaps = [(b[0] - a[0]) * 1000 for a, b in zip(pkts, pkts[1:])]
    inpkt = statistics.mean(gaps) if gaps else 0.0
    jit = statistics.pstdev(gaps) if len(gaps) > 1 else 0.0
    mean = total // count if count else 0
    return count, total, mean, inpkt, jit


def _state(flow):
    """Estado da conexão no vocabulário do Argus usado pelo UNSW-NB15."""
    has_reply = bool(flow.pkts["d"])
    if flow.proto == "tcp":
        if flow.fin:
            return "FIN"
        if flow.rst:
            return "RST" if not has_reply or flow.synack_ts is None else "FIN"
        if flow.synack_ts is None and flow.syn_ts is not None:
            return "REQ"
        return "CON"
    if flow.proto in ("icmp", "ipv6-icmp"):
        return "ECO" if not has_reply else "CON"
    return "CON" if has_reply else "INT"


def _ct_state_ttl(state, sttl, dttl):
    """Regra do UNSW-NB15 que combina estado e faixas de TTL."""
    if sttl in (62, 63, 254, 255) and dttl in (252, 253) and state == "FIN":
        return 1
    if sttl in (0, 62, 254) and dttl == 0 and state == "INT":
        return 2
    if sttl in (62, 254) and dttl in (60, 252, 253) and state == "CON":
        return 3
    if sttl == 254 and dttl == 252 and state == "ACC":
        return 4
    if sttl == 254 and dttl == 252 and state == "CLO":
        return 5
    if sttl == 254 and dttl == 0 and state == "REQ":
        return 6
    return 0


def read_flows(path):
    flows, active = [], {}
    with PcapReader(str(path)) as reader:
        for pkt in reader:
            ts = float(pkt.time)
            if ARP in pkt:
                arp = pkt[ARP]
                src, dst, sport, dport, proto, ttl, size = arp.psrc, arp.pdst, 0, 0, "arp", 0, len(arp)
                l4 = None
            elif IP in pkt or IPv6 in pkt:
                ip = pkt[IP] if IP in pkt else pkt[IPv6]
                src, dst = ip.src, ip.dst
                ttl = ip.ttl if IP in pkt else ip.hlim
                size = ip.len if IP in pkt else ip.plen + 40
                proto_num = ip.proto if IP in pkt else ip.nh
                proto = PROTO_NAMES.get(proto_num, str(proto_num))
                l4 = pkt[TCP] if TCP in pkt else (pkt[UDP] if UDP in pkt else None)
                sport = int(l4.sport) if l4 is not None else 0
                dport = int(l4.dport) if l4 is not None else 0
            else:
                continue

            fwd = (proto, src, sport, dst, dport)
            rev = (proto, dst, dport, src, sport)
            flow, direction = active.get(fwd), "s"
            if flow is None and rev in active:
                flow, direction = active[rev], "d"
            # Fluxo encerrado (FIN/RST já trocados) ou parado há muito tempo
            if flow is not None and (ts - flow.last > IDLE_TIMEOUT or flow.closed):
                del active[flow.key]
                flow = None
            if flow is None:
                direction = "s"
                flow = Flow(fwd, src, dst, sport, dport, proto, ts)
                active[fwd] = flow
                flows.append(flow)

            tcp = pkt[TCP] if TCP in pkt else None
            payload = bytes(pkt[Raw].load) if Raw in pkt else b""
            flow.add(direction, ts, size, ttl, tcp, payload)
            if tcp is not None and int(tcp.flags) & 0x04:
                flow.closed = True
    return flows


def flow_features(flows):
    flows.sort(key=lambda f: f.start)
    rows = []
    for i, f in enumerate(flows):
        spkts, sbytes, smean, sinpkt, sjit = _direction_stats(f.pkts["s"])
        dpkts, dbytes, dmean, dinpkt, djit = _direction_stats(f.pkts["d"])
        dur = f.last - f.start
        state = _state(f)
        sttl = f.ttl["s"] or 0
        dttl = f.ttl["d"] or 0
        service = SERVICE_BY_PORT.get(f.dport, "-") if f.proto in ("tcp", "udp") else "-"
        synack = (f.synack_ts - f.syn_ts) if f.syn_ts and f.synack_ts else 0.0
        ackdat = (f.ack_ts - f.synack_ts) if f.synack_ts and f.ack_ts else 0.0

        recent = flows[max(0, i - WINDOW + 1): i + 1]
        services = [SERVICE_BY_PORT.get(r.dport, "-") for r in recent]
        row = {
            "conexao": i,
            "inicio_s": round(f.start - flows[0].start, 3),
            "origem": f"{f.src}:{f.sport}",
            "destino": f"{f.dst}:{f.dport}",
            "pacotes": spkts + dpkts,
            "dur": round(dur, 6),
            "proto": f.proto if f.proto in TOP_PROTO else "other",
            "service": service,
            "state": state,
            "rate": round((spkts + dpkts - 1) / dur, 6) if dur > 0 else 0.0,
            "sttl": sttl,
            "dttl": dttl,
            "sload": round(8 * sbytes * (spkts - 1) / spkts / dur, 6) if dur > 0 and spkts else 0.0,
            "dload": round(8 * dbytes * (dpkts - 1) / dpkts / dur, 6) if dur > 0 and dpkts else 0.0,
            "sloss": f.loss["s"],
            "dloss": f.loss["d"],
            "sinpkt": round(sinpkt, 6),
            "dinpkt": round(dinpkt, 6),
            "sjit": round(sjit, 6),
            "djit": round(djit, 6),
            # O UNSW-NB15 guarda a janela TCP limitada a 255
            "swin": min(f.win["s"], 255) if f.proto == "tcp" else 0,
            "stcpb": f.isn["s"] if f.proto == "tcp" else 0,
            "dtcpb": f.isn["d"] if f.proto == "tcp" else 0,
            "tcprtt": round(synack + ackdat, 6),
            "ackdat": round(ackdat, 6),
            "smean": smean,
            "dmean": dmean,
            "trans_depth": f.http_requests if service == "http" else 0,
            "response_body_len": f.response_body_len if service == "http" else 0,
            "ct_srv_src": sum(1 for r, s in zip(recent, services) if s == service and r.src == f.src),
            "ct_state_ttl": _ct_state_ttl(state, sttl, dttl),
            "ct_dst_ltm": sum(1 for r in recent if r.dst == f.dst),
            "ct_src_dport_ltm": sum(1 for r in recent if r.src == f.src and r.dport == f.dport),
            "ct_dst_sport_ltm": sum(1 for r in recent if r.dst == f.dst and r.sport == f.sport),
            "ct_dst_src_ltm": sum(1 for r in recent if r.src == f.src and r.dst == f.dst),
            "ct_ftp_cmd": f.ftp_cmds,
            "ct_flw_http_mthd": f.http_requests if service == "http" else 0,
            "ct_src_ltm": sum(1 for r in recent if r.src == f.src),
            "is_sm_ips_ports": int(f.src == f.dst and f.sport == f.dport),
        }
        rows.append(row)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("captura", type=Path, help="arquivo .pcap ou .pcapng")
    parser.add_argument("-o", "--saida", type=Path, help="CSV de saída (padrão: <captura>.csv)")
    parser.add_argument("--json", action="store_true",
                        help="também salva cada conexão em JSON, para colar na tela de predição")
    args = parser.parse_args()

    flows = read_flows(args.captura)
    if not flows:
        sys.exit("Nenhuma conexão encontrada na captura.")
    rows = flow_features(flows)

    saida = args.saida or args.captura.with_suffix(".csv")
    with open(saida, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=ID_COLUMNS + FEATURES)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} conexões salvas em {saida}")

    if args.json:
        pasta = saida.with_suffix("")
        pasta.mkdir(exist_ok=True)
        for row in rows:
            dados = {k: row[k] for k in FEATURES}
            (pasta / f"conexao_{row['conexao']:03d}.json").write_text(
                json.dumps(dados, indent=2), encoding="utf-8")
        print(f"JSON de cada conexão em {pasta}/")

    print()
    print(f"{'#':>3}  {'origem':<22} {'destino':<22} {'serviço':<8} {'estado':<6} pacotes")
    for row in rows[:30]:
        print(f"{row['conexao']:>3}  {row['origem']:<22} {row['destino']:<22} "
              f"{row['service']:<8} {row['state']:<6} {row['pacotes']}")
    if len(rows) > 30:
        print(f"... e mais {len(rows) - 30} conexões no CSV")


if __name__ == "__main__":
    main()
