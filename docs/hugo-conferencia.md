# Conferência da base HUGO

Fonte: `02 NOVO HUGO - BASE HUGO VIGENTE Rafael.xlsx`. Importação dos valores armazenados nas seis abas de cenários, de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não foram importados como cenários. A assinatura SHA-256 consta em `hugo-source.js`; o arquivo completo não é publicado.

| Aba de origem | Cenário | Planilha e dashboard — mensal |
| --- | --- | ---: |
| HUGO - SEM BANCO DE SANGUE | Novo prédio — sem incrementos | R$ 27.571.044,71 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 27.751.484,21 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 27.893.984,21 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 28.127.378,21 |
| HUGO - MENOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 29.244.113,21 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 32.375.824,12 |

| Incremento independente | Composição | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total + 25 bolsas de plaquetas por aférese | R$ 180.439,50 |
| Ressonância magnética | 100 exames internos + 300 externos | R$ 142.500,00 |
| SAD | 120 atendimentos domiciliares | R$ 233.394,00 |
| Hemodinâmica | 250 procedimentos | R$ 1.116.735,00 |
| Adequação de leitos | +35 UI e +20 UTI; ajuste de 18 produções de SADT | R$ 3.131.710,91 |

Ressonância + hemodinâmica, sem banco e sem os demais incrementos: **R$ 28.830.279,71**. Os cinco incrementos podem ser combinados em qualquer ordem; os testes verificam os 32 conjuntos, todas as linhas dos seis cenários e a soma das categorias em centavos.

## Regras preservadas

- Os pacientes-dia usam `ROUNDUP(leitos × ocupação × 30,4; 0)`, conforme as abas da fonte. Ocupação editável em passos de 0,5 ponto percentual.
- Cirurgias preservam horas fracionadas; serviços usam quantidade × custo unitário. Valores de cada linha são arredondados a centavos antes da soma.
- P12 usa `SUM(P6:P10)` e exclui a linha P11, UI Cirúrgica do 2º andar, R$ 1.094.156,85. Essa regra financeira foi preservada para reproduzir o total solicitado; a retirada do banner não altera o cálculo. A linha segue nos indicadores de leitos e é identificada na própria linha e no CSV.
- Sem adequação são 336 UI + 70 UTI = 406 leitos; com adequação, 371 UI + 90 UTI = 461. PS Observação, hospital dia e escritório de gestão de altas ficam fora dessa contagem.
- Adequação aplica os aumentos de UI, UTI e SADT juntos. Alterar manualmente uma linha não reestima a produção das outras.
- A seleção ou retirada de um incremento restaura suas próprias linhas; preserva as demais edições manuais.
- T.A Atual, base HUGOL e base HUGO têm estados separados. O comparativo lê os valores, leitos e incrementos de cada estado, sem coluna de ocupação.

Os totais originais têm frações abaixo de um centavo em algumas células. A importação confere o total arredondado contra a soma das linhas monetárias em centavos; os seis totais coincidem.
