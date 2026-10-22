# Conferência da atualização de valores e quantitativo

Fonte: `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26.xlsx`. Período dos custos: agosto/2025 a julho/2026. São importadas as seis abas de cenários, preservando os valores armazenados e as referências da coluna **S — Custo Total Estimado**. HUGO - ATUAL, Azul e RESUMO não são fontes importadas. O SHA-256 está em `updated-source.js`; a planilha completa não é publicada.

| Aba de origem | Cenário | Planilha e dashboard — mensal |
| --- | --- | ---: |
| HUGO - SEM BANCO DE SANGUE | Novo Prédio - Base | R$ 30.729.611,55 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 30.975.378,30 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 31.132.986,30 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 31.321.717,50 |
| HUGO - MENOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 32.235.250,00 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 35.595.648,39 |

Os totais monetários são somados em centavos. Frações inferiores a um centavo em células de horas cirúrgicas são arredondadas na linha; os seis totais resultantes coincidem com S89 arredondado a duas casas.

## Preços e quantitativos

Cada fórmula S da planilha determina o preço efetivamente usado, em geral P50, com P75 nas UTI, cirurgias eletivas de alto custo e hemodinâmica. A nova aba identifica o percentil de referência por linha. As colunas de contrato anterior e os percentuais da coluna BASE são referências auxiliares da planilha.

| Serviço | Referência de preço | Valor unitário |
| --- | --- | ---: |
| UI | P50, coluna N | R$ 1.079,46 |
| UTI | P75, coluna O | R$ 3.301,57 |
| Pronto Atendimento Geral | P75, célula O24 | R$ 1.175,34 |
| Cirurgias eletivas de alto custo | P75 | R$ 3.117,87/hora |
| Demais modalidades cirúrgicas | P50 | R$ 2.394,43/hora |
| Hemodinâmica | P75 | R$ 3.654,13 |

A fórmula S23 é `K23*O24`, com referência à célula da linha seguinte. Essa referência foi preservada: 2.588 atendimentos × R$ 1.175,34 = R$ 3.041.779,92. A célula O23 contém outro valor; as células de origem e a fórmula ficam registradas para rastreio.

O cenário base mantém 336 enfermaria + 70 UTI = 406 leitos, incluindo os 18 de PS Observação na contagem definida pelo usuário. São 1.173 cirurgias e 2.649,7 horas cirúrgicas mensais no quadro novo; demais cirurgias de urgência têm 763 procedimentos a 1,9 hora média. O escritório de gestão de altas usa quantidade 10, conforme K87. Essa quantidade não integra os leitos de internação.

## Incrementos

| Opção | Composição | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total × R$ 284,33 + 25 plaquetas × R$ 1.300,77 | R$ 245.766,75 |
| Ressonância magnética | 100 exames internos + 300 externos, a R$ 394,02 | R$ 157.608,00 |
| SAD | 120 atendimentos × R$ 1.572,76 | R$ 188.731,20 |
| Hemodinâmica original | 250 procedimentos × R$ 3.654,13 | R$ 913.532,50 |
| Hemodinâmica alternativa | 450 procedimentos × R$ 3.654,13 | R$ 1.644.358,50 |

A escolha de 450 substitui a de 250 e usa o custo unitário atual da linha. O cenário completo com 450 é **R$ 36.326.474,39/mês**.

| Adequação isolada | Leitos acrescentados | Custo direto dos leitos | SADT isolado | Acréscimo isolado mensal |
| --- | ---: | ---: | ---: | ---: |
| Enfermaria (UI) | 35 | R$ 1.033.043,22 | R$ 270.835,98 | R$ 1.303.879,20 |
| UTI | 20 | R$ 1.905.005,89 | R$ 151.111,38 | R$ 2.056.117,27 |

Com ambas, o acréscimo é **R$ 3.360.398,39**, dos quais R$ 422.349,28 em SADT. Os índices seguem `W45 = ROUND(Z4;2)`, `Z4 = Y4/X4` e referência X4 = 406. Quantidades de SADT são arredondadas a partir de V em cada linha. Para UI isolada, índice 1,09; UTI, 1,05; ambas, 1,14. A projeção isolada usa a mesma regra proporcional já adotada no painel; a planilha fornece o cenário conjunto. Os efeitos isolados não somam diretamente o conjunto devido aos arredondamentos.

## Validação e isolamento

- Todas as 52 linhas dos seis cenários e os totais S89 são conferidos.
- As 64 combinações, com adequações separadas e alternativa de 450 hemodinâmicas, são verificadas em centavos.
- Paciente-dia segue `ROUNDUP(leitos × ocupação × 30,4;0)`; cirurgias preservam horas fracionadas. A ocupação continua editável de 0,5 em 0,5 ponto percentual.
- A capacidade inicial é 406 leitos; apenas UI ampliada, 441; apenas UTI, 426; ambas, 461.
- Ajustes desta aba usam `novo-hugo-updated-v1`, separados das três bases anteriores. O comparativo e seus CSVs incluem a quarta base e seus ajustes atuais.
- Os arquivos de dados e modelo novos exigem autenticação tanto no servidor local quanto no Netlify.
