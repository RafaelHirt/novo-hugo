# Conferência da base HUGOL

Correção posterior confirmada pelo usuário: gestão de altas usa **R$ 4.948,21 por unidade** em todos os cenários HUGOL. A base sem aumento passa a R$ 25.963.506,96 (5 unidades); o novo prédio base, R$ 27.381.560,79; o completo com 250 hemodinâmicas, R$ 32.038.952,33; com 450, R$ 32.932.340,33 (10 unidades). A alteração está explícita em `hugol-model.js`, preservando a importação original documentada abaixo. As referências foram restauradas na interface, no comparativo e no CSV: os Ps confirmados da imagem HUGOL e o valor contratual HUGO. Com a correção de gestão de altas, 47 preços do novo prédio conferem e cinco continuam sem referência na imagem; na base sem aumento, são 35 confirmados e sete sem referência.

Fonte atual: `01 NOVO HUGO - BASE HUGOL.xlsx`. Importação dos valores armazenados nas sete abas de cenários; HUGO - ATUAL, Azul e RESUMO não são fontes importadas. A assinatura SHA-256 consta em `hugol-source.js`.

O arquivo reenviado como `01 NOVO HUGO - BASE HUGOL (3).xlsx` é idêntico em bytes à fonte importada: SHA-256 `e4ae80ef5fac2f81f18982736ad1fef466fc74cfd8940b016688fbbf404cb223`. A conferência das 354 linhas nos sete cenários (42 na base sem aumento e 52 em cada cenário do novo prédio) confirma nomes, critérios, quantidades, ocupações, preços e totais, com uma única exceção: a correção de gestão de altas já autorizada pelo usuário. O reenvio não altera essa decisão. Estados editados e salvos no navegador podem apresentar outros totais; a comparação abaixo usa os cenários de referência sem edições manuais.

Os custos unitários foram também comparados à imagem corrigida de percentis HUGOL enviada pelo usuário em 24/10/2026, substituindo a anterior. Veja [a conferência das 94 linhas das duas bases](hugol-percentis-conferencia.md): gestão de altas diverge (R$ 5.153,41 na planilha contra P50 de R$ 4.948,21 na imagem); serviços sem referência permanecem sem P. Esta conferência não altera os totais abaixo.

| Aba de origem | Cenário | Planilha — mensal | Dashboard com gestão de altas corrigida — mensal |
| --- | --- | ---: | ---: |
| HUGO - BASE HUGOL | Base HUGOL sem aumento | R$ 25.964.532,96 | R$ 25.963.506,96 |
| HUGO - SEM BANCO DE SANGUE | Novo Prédio - Base | R$ 27.383.612,79 | R$ 27.381.560,79 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 27.564.052,29 | R$ 27.562.000,29 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 27.706.552,29 | R$ 27.704.500,29 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 27.939.946,29 | R$ 27.937.894,29 |
| HUGO - MESMOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 29.056.681,29 | R$ 29.054.629,29 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 32.041.004,33 | R$ 32.038.952,33 |

A planilha mantém R$ 5.153,41 por unidade em H69 (base sem aumento, cinco unidades) e M87 (novo prédio, dez unidades). O dashboard aplica R$ 4.948,21; a diferença total é de −R$ 1.026,00 e −R$ 2.052,00, respectivamente. As demais linhas coincidem, inclusive seus totais em centavos.

A fórmula P12 desta versão é `SUM(P6:P11)`, incluindo a UI do 2º andar (R$ 1.308.864,45). O importador verifica o intervalo real da fórmula, em vez de reproduzir a exclusão da versão anterior. Todas as linhas e os sete totais foram conferidos em centavos.

## Seleção e capacidade

| Opção | Leitos acrescentados | Custo direto dos leitos | SADT isolado | Acréscimo isolado mensal |
| --- | ---: | ---: | ---: | ---: |
| Adequação de enfermaria | 35 UI | R$ 1.143.911,67 | R$ 256.829,80 | R$ 1.400.741,47 |
| Adequação de UTI | 20 UTI | R$ 1.439.066,85 | R$ 144.054,47 | R$ 1.583.121,32 |

Com as duas adequações, o acréscimo é **R$ 2.984.323,04**, dos quais R$ 401.344,52 em SADT. Essa combinação reproduz a planilha. Os efeitos isolados não são somados diretamente: o índice de SADT e as quantidades de cada linha têm arredondamentos.

A contagem de enfermaria inclui **318 UI + 18 PS Observação = 336**, conforme a decisão atual do usuário. O custeio permanece igual. Os indicadores acompanham essa capacidade inicial e os acréscimos selecionados:

| Adequação | Enfermaria | UTI | Total físico |
| --- | ---: | ---: | ---: |
| Sem adequação | 336 | 70 | 406 |
| Somente UI | 371 | 70 | 441 |
| Somente UTI | 336 | 90 | 426 |
| UI e UTI | 371 | 90 | 461 |

A distribuição da planilha soma 336 posições na base e 371 com adequação de UI. O desconto anterior de 18 no indicador foi retirado; os valores financeiros permanecem intactos. Edições manuais de quantidade acompanham a capacidade ativa. Hospital dia e escritório de gestão de altas permanecem fora do indicador de internação.

## Outros incrementos

| Opção | Composição | Custeio mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total + 25 bolsas de plaquetas por aférese | R$ 180.439,50 |
| Ressonância magnética | 100 exames internos + 300 externos | R$ 142.500,00 |
| SAD | 120 atendimentos domiciliares | R$ 233.394,00 |
| Hemodinâmica original | 250 procedimentos × R$ 4.466,94 | R$ 1.116.735,00 |
| Hemodinâmica alternativa | 450 procedimentos × R$ 4.466,94 | R$ 2.010.123,00 |

250 e 450 são alternativas de uma única opção de hemodinâmica. O valor é recalculado com o custo unitário atual da linha; selecionar 450 não duplica o serviço. O cenário completo com 450 custa **R$ 32.932.340,33**, já com a correção de gestão de altas.

## Regras de cálculo

- Novo prédio: paciente-dia arredondado para cima, conforme `ROUNDUP(leitos × ocupação × 30,4; 0)`. Base sem aumento: arredondamento ao inteiro mais próximo.
- Cirurgias do novo prédio preservam horas fracionadas. Serviços usam quantidade × custo unitário; valores de linha são somados em centavos.
- SADT da adequação: `T45 = ROUND(W4;2)`, `W4 = V4/U4`, com U4 = 406 na fonte. Selecionar +35 UI produz índice 1,09; +20 UTI, 1,05; ambas, 1,14. A quantidade de cada uma das 18 linhas é arredondada conforme `ROUND(S_linha × T45;0)`.
- Com ambas as adequações, usam-se os valores finais armazenados no arquivo. Uma edição manual permanece local à linha; selecionar ou retirar uma adequação restaura suas linhas e as produções de SADT relacionadas.
- A seleção antiga de adequação é convertida nas duas opções de leitos, preservando os demais ajustes salvos.
- 4 T.A (Atual), base HUGOL e base HUGO têm estados separados; o comparativo lê a seleção e a capacidade física de cada estado.

Os testes verificam os sete cenários originais, todas as linhas, as 64 combinações com UI/UTI separadas, a alternativa de 450 hemodinâmicas e a migração dos estados salvos. O navegador foi verificado de 360 a 1440 pixels.

## Fluxo simplificado da interface

A barra **Base** permite alternar entre a base HUGOL sem aumento e o Novo Prédio. Em seguida aparecem os indicadores financeiros e as caixas dos serviços adicionais, sem um resumo duplicado. Os cenários prontos permanecem disponíveis na opção recolhida **Usar um cenário da planilha**. O bloco “Cenário atual” e sua composição visual foram removidos, assim como os cartões explicativos de escolha da base.

A composição permanece disponível internamente em `snapshot.calculation`, com cobertura de testes financeiros. No exemplo com os seis incrementos e sem edições, **R$ 27.381.560,79 + R$ 4.657.391,54 + R$ 0,00 = R$ 32.038.952,33**. Os indicadores e a seleção de serviços continuam atualizados ao editar, restaurar ou recarregar.
