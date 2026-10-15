# Conferência da base HUGOL

Fonte atual: `01 NOVO HUGO - BASE HUGOL.xlsx`. Importação dos valores armazenados nas sete abas de cenários; HUGO - ATUAL, Azul e RESUMO não são fontes importadas. A assinatura SHA-256 consta em `hugol-source.js`.

| Aba de origem | Cenário | Planilha e dashboard — mensal |
| --- | --- | ---: |
| HUGO - BASE HUGOL | Base HUGOL sem aumento | R$ 25.964.532,96 |
| HUGO - SEM BANCO DE SANGUE | Novo prédio — sem incrementos | R$ 27.383.612,79 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 27.564.052,29 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 27.706.552,29 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 27.939.946,29 |
| HUGO - MESMOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 29.056.681,29 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 32.041.004,33 |

A fórmula P12 desta versão é `SUM(P6:P11)`, incluindo a UI do 2º andar (R$ 1.308.864,45). O importador verifica o intervalo real da fórmula, em vez de reproduzir a exclusão da versão anterior. Todas as linhas e os sete totais foram conferidos em centavos.

## Seleção e capacidade

| Opção | Leitos acrescentados | Custo direto dos leitos | SADT isolado | Acréscimo isolado mensal |
| --- | ---: | ---: | ---: | ---: |
| Adequação de enfermaria | 35 UI | R$ 1.143.911,67 | R$ 256.829,80 | R$ 1.400.741,47 |
| Adequação de UTI | 20 UTI | R$ 1.439.066,85 | R$ 144.054,47 | R$ 1.583.121,32 |

Com as duas adequações, o acréscimo é **R$ 2.984.323,04**, dos quais R$ 401.344,52 em SADT. Essa combinação reproduz a planilha. Os efeitos isolados não são somados diretamente: o índice de SADT e as quantidades de cada linha têm arredondamentos.

A capacidade física de enfermaria foi definida pelo usuário como **318**, sem alterar o custeio ou as quantidades financeiras distribuídas nas seis UI. Os indicadores usam essa capacidade inicial e acompanham os acréscimos de leitos:

| Adequação | Enfermaria | UTI | Total físico |
| --- | ---: | ---: | ---: |
| Sem adequação | 318 | 70 | 388 |
| Somente UI | 353 | 70 | 423 |
| Somente UTI | 318 | 90 | 408 |
| UI e UTI | 353 | 90 | 443 |

A distribuição de custeio da planilha soma 336 posições de UI na base e 371 com adequação. Esse número não é substituído no cálculo financeiro. Edições manuais de quantidade acompanham a variação da capacidade, limitada a zero quando todas as UI são retiradas. PS Observação, hospital dia e escritório de gestão de altas não entram no indicador de internação.

## Outros incrementos

| Opção | Composição | Custeio mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total + 25 bolsas de plaquetas por aférese | R$ 180.439,50 |
| Ressonância magnética | 100 exames internos + 300 externos | R$ 142.500,00 |
| SAD | 120 atendimentos domiciliares | R$ 233.394,00 |
| Hemodinâmica original | 250 procedimentos × R$ 4.466,94 | R$ 1.116.735,00 |
| Hemodinâmica alternativa | 450 procedimentos × R$ 4.466,94 | R$ 2.010.123,00 |

250 e 450 são alternativas de uma única opção de hemodinâmica. O valor é recalculado com o custo unitário atual da linha; selecionar 450 não duplica o serviço. O cenário completo com 450 custa **R$ 32.934.392,33**.

## Regras de cálculo

- Novo prédio: paciente-dia arredondado para cima, conforme `ROUNDUP(leitos × ocupação × 30,4; 0)`. Base sem aumento: arredondamento ao inteiro mais próximo.
- Cirurgias do novo prédio preservam horas fracionadas. Serviços usam quantidade × custo unitário; valores de linha são somados em centavos.
- SADT da adequação: `T45 = ROUND(W4;2)`, `W4 = V4/U4`, com U4 = 406 na fonte. Selecionar +35 UI produz índice 1,09; +20 UTI, 1,05; ambas, 1,14. A quantidade de cada uma das 18 linhas é arredondada conforme `ROUND(S_linha × T45;0)`.
- Com ambas as adequações, usam-se os valores finais armazenados no arquivo. Uma edição manual permanece local à linha; selecionar ou retirar uma adequação restaura suas linhas e as produções de SADT relacionadas.
- A seleção antiga de adequação é convertida nas duas opções de leitos, preservando os demais ajustes salvos.
- 4 T.A (Atual), base HUGOL e base HUGO têm estados separados; o comparativo lê a seleção e a capacidade física de cada estado.

Os testes verificam os sete cenários originais, todas as linhas, as 64 combinações com UI/UTI separadas, a alternativa de 450 hemodinâmicas e a migração dos estados salvos. O navegador foi verificado de 360 a 1440 pixels.
