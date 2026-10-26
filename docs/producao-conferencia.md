# Conferência de valores e produção

Fonte do **Prédio atual**: `06 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - agosto25 a julho26 (3).xlsx`. Somente a aba **HUGO - ATUAL** dessa fonte é importada, conforme esclarecimento do usuário. O total P71 é **R$ 26.618.281,37 por mês**, ou R$ 319.419.376,44 por ano. Seus 42 serviços e sua produção são preservados. A aba anterior de Atualização de valores está oculta e tem sua própria fonte, ajustes e correção de preço de PA.

Com o envio de `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26 (3) FINAL.xlsx`, os seis cenários novos são identificados como **Novo HUGO - Taxa de ocupação estimada**: de R$ 29.304.814,03 sem adicionais a R$ 34.170.850,87 com todos e 250 hemodinâmicas. A sequência começa em **HUGO - SEM BANCO DE SANGUE**. Todos os preços estão disponíveis. A tabela abaixo continua descrevendo a referência anterior, agora identificada como **Atual HUGO - Taxa de ocupação real**; a [conferência dos novos serviços](producao-incrementos.md) registra as outras abas e seus valores. O valor inicial de **R$ 26.618.281,37** é preservado, com os novos cenários acrescentados depois dele. Nenhum preço ou quantidade anterior foi alterado. A base HUGO - ATUAL do anexo FINAL (R$ 27.719.812,85) é registrada para auditoria, preservando a fonte 06 já existente.

| Categoria | Total mensal |
| --- | ---: |
| Enfermarias | R$ 8.541.260,18 |
| UTI | R$ 6.124.412,35 |
| Emergência | R$ 1.750.689,60 |
| Hospital dia | R$ 210.594,45 |
| Atendimento ambulatorial | R$ 702.949,94 |
| Cirurgias | R$ 5.048.378,42 |
| SADT interno | R$ 4.015.703,18 |
| SADT externo | R$ 198.526,20 |
| Escritório de gestão de altas | R$ 25.767,05 |
| **Total** | **R$ 26.618.281,37** |

## Custos escolhidos

Os cabeçalhos K3, L3 e M3 identificam P25, P50 e P75. Em cada uma das 42 linhas, a célula de preço marcada em verde coincide com a referência da fórmula `P = ROUND(J × preço;2)`. A importação interrompe se essa conferência divergir; nenhuma fórmula arbitrária da planilha é executada.

Há **34 linhas P50 e 8 P75**, sem seleção P25 nesta versão. P75 está nas cinco UTI, na UI da população privada de liberdade, no Pronto Atendimento e nas cirurgias de alto custo. O Pronto Atendimento usa M22 = R$ 624,80 e 2.802 atendimentos: R$ 1.750.689,60/mês. A referência é M22 desta planilha. A fonte anterior também passou a usar o preço P75 de R$ 624,80, por correção explícita do usuário, mantendo o arquivo importado intacto.

Os percentis são apresentados em etiquetas junto ao custo unitário, no detalhe do comparativo e no CSV do cenário. Ao editar o preço, a indicação passa a “Editado · ref. P50/P75”, preservando o percentil de origem. As bases de incrementos HUGO e HUGOL também voltaram a exibir suas referências, respectivamente como valores contratuais e Ps confirmados na imagem. Ocupações alteradas mostram a taxa original e a ajustada em “Antes → Atual”; **Restaurar bloco** retorna todos os serviços daquela categoria ao cenário de referência, preservando os outros blocos.

## Produção e ocupação

Quantidades/leitos vêm de H; ocupações ou horas médias, de I; produção/pacientes-dia, de J. São 336 enfermaria (incluindo 18 de PS Observação) e 70 UTI, total de 406. As UTI estão distribuídas em 10, 20, 20, 10 e 10 leitos. O escritório de gestão de altas não integra essa capacidade. O indicador **Leitos de Internação (Mapa de Leitos)** da opção **Atual HUGO - Taxa de ocupação real** deduz 18 apenas da enfermaria exibida: **318 + 70 = 388**. Serviços, descrições, quantidades e custos, inclusive R$ 26.618.281,37, são preservados. A opção **Novo HUGO - Taxa de ocupação estimada** mantém 336 + 70 = 406, ou 371 + 90 = 461 com ambas as adequações. O comparativo acompanha esses mapas.

As ocupações de origem são 72%, 76%, 83%, 57% e 120% nas enfermarias/observação e 101%, 99%, 69%, 78% e 95% nas UTI. Elas permanecem editáveis, incluindo valores acima de 100%, em passos de 0,5 ponto percentual. Paciente-dia segue `ROUND(leitos × ocupação × 30,4;0)` e reproduz todos os valores J da fonte. São 937 demais cirurgias, com 2 horas médias e 1.874 horas/mês, além das 30 de alto custo com 180 horas/mês.

O botão “Aplicar ao bloco” altera as ocupações de todas as linhas ativas daquele bloco, inclusive as ocultas por busca. Enfermarias inclui PS Observação. Linhas retiradas, o outro bloco, quantidades, preços e seleções de incrementos são preservados. Na base original desta aba:

- Enfermarias a 80%: R$ 8.723.446,82 no bloco e R$ 26.800.468,01 no total.
- UTI a 90%: R$ 6.325.808,12 no bloco e R$ 26.819.677,14 no total.

O controle existe nas cinco bases financeiras. Estados são independentes; a nova aba salva em `novo-hugo-production-v1`. O comparativo recebe as cinco seleções visíveis atuais e permite escolher esta base como referência. O arquivo gerado registra SHA-256, linhas, células verdes e fórmulas de origem em `production-source.js`; esses dados exigem autenticação.

## Escopo e salvamento

A barra **Atual HUGO - Taxa de ocupação real / Novo HUGO - Taxa de ocupação estimada** identifica as duas opções. A Real aparece primeiro e preserva a referência anterior. Os Estimados começam na aba HUGO - SEM BANCO DE SANGUE, a R$ 29.304.814,03, e sua variação inclui somente os adicionais e as edições aplicadas. Seis caixas independentes permitem escolher os serviços do anexo, com adequações separadas de UI e UTI. Os cenários prontos ficam em uma opção recolhida, com o rótulo correspondente em cada um. O comparativo e os CSVs também identificam o tipo de ocupação. Não há custos pendentes a digitar. O bloco “Cenário atual” continua removido.

O salvamento usa versão 6 e rascunhos separados. Estados válidos das versões 5 e 6 preservam seleção, preços, quantidades e ocupações ao atualizar os rótulos. Ao migrar dados mais antigos, recupera somente ajustes dos 42 serviços reais, inclusive do rascunho da base atual quando a simulação antiga estava selecionada. Os novos serviços têm IDs próprios e preços do arquivo; preços simulados antigos não reaparecem. Restaurar valores retorna à base da opção selecionada e mantém o rascunho da outra. O comparativo e as exportações acompanham a seleção.
