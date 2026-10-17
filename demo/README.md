# Demonstração com uma conexão real

Este roteiro leva uma conexão de rede feita de verdade no seu computador até
o sistema: você grava o tráfego com o Wireshark, o script `pcap_para_csv.py`
calcula as 34 colunas do UNSW-NB15 para cada conexão e o CSV gerado vai para
a tela de Análise em Lote.

## 1. Gravar o tráfego (Wireshark)

1. Instale o Wireshark (https://www.wireshark.org). No Windows o instalador
   já traz o Npcap, que é o que permite gravar pacotes.
2. Abra o Wireshark, dê dois cliques na placa de rede que você usa (Wi-Fi ou
   Ethernet) e a gravação começa.
3. Faça as conexões que quer mostrar, por exemplo abrir `http://neverssl.com`
   (site sem HTTPS, então o script consegue ler a requisição HTTP) e mais um
   ou dois sites comuns.
4. Pare a gravação (quadrado vermelho) e salve em **Arquivo > Salvar como**,
   por exemplo `captura.pcapng`. Grave poucos segundos: o arquivo fica
   pequeno e as conexões ficam fáceis de explicar.

## 2. Converter para o formato do sistema

Na pasta do projeto:

```bash
pip install scapy
python demo/pcap_para_csv.py captura.pcapng
```

O script cria `captura.csv` e mostra na tela a lista de conexões (origem,
destino, serviço, estado). Com `--json` ele também salva cada conexão em um
arquivo JSON, no formato da tela de predição individual.

As cinco primeiras colunas do CSV (`conexao`, `inicio_s`, `origem`,
`destino`, `pacotes`) só identificam a conexão; o sistema as ignora.

## 3. Testar no sistema

Entre em https://ml-network-ids.onrender.com, abra **Análise em Lote** e
envie o `captura.csv`. A linha 0 do resultado é a conexão 0 do CSV, e assim
por diante.

## O que esperar (e o que dizer à banca)

O caminho inteiro funciona: captura, extração das colunas, envio e
classificação. O resultado da classificação, porém, precisa ser explicado.
O UNSW-NB15 foi gravado em 2015 num laboratório fechado, e o modelo aprendeu
características desse laboratório. A principal é o TTL dos pacotes (`sttl` e
`dttl`): no conjunto de teste, o tráfego normal quase sempre tem TTL 31/29 e
o ataque 254/252. Uma rede comum usa outros valores (64 no Linux, 128 no
Windows), que o modelo nunca viu.

Testes feitos com este script (outubro de 2026):

| Tráfego gravado | Conexões | Classificadas como ataque |
| --- | --- | --- |
| Navegação HTTPS real (Google, GitHub, Wikipedia) | 29 | 29 |
| Mesmas conexões, trocando só o TTL para 31/29 | 29 | 0 |
| 4 downloads HTTP num servidor local | 4 | 2 |
| Varredura de 300 portas no próprio computador | 300 | 12 |

Ou seja, em tráfego real o modelo decide quase só pelo TTL, e por isso erra.
Isso não é defeito do script nem do sistema: é a diferença entre os dados do
laboratório e uma rede real (em inglês, *domain shift*), uma limitação
conhecida de modelos treinados só com o UNSW-NB15. Os caminhos para resolver
são retreinar com tráfego da rede onde o sistema vai rodar, ou treinar sem as
colunas que dependem do ambiente (`sttl`, `dttl`, `ct_state_ttl`).

Outras colunas também são aproximações: as contagens `ct_*` olham as últimas
100 conexões da sua captura, e a janela TCP (`swin`) é limitada a 255, como
no UNSW-NB15.

Para a varredura de portas, use apenas o seu próprio computador ou o
`scanme.nmap.org`, que o projeto Nmap autoriza para testes. Varrer redes de
terceiros sem permissão é proibido.
