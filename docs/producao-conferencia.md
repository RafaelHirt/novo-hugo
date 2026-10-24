# Conferência de valores e produção

Fonte: `06 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - agosto25 a julho26 (4).xlsx`. Somente a aba **HUGO - ATUAL** é importada, conforme esclarecimento do usuário. O total P71 é **R$ 26.618.281,37 por mês**, ou R$ 319.419.376,44 por ano. A aba anterior de Atualização de valores está oculta e tem sua própria fonte, ajustes e correção de preço de PA. A aba de valores e produção também oferece a simulação do Novo Prédio com incrementos, descrita em [composição dos incrementos](producao-incrementos.md).

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

Os percentis são apresentados em etiquetas junto ao custo unitário, no detalhe do comparativo e no CSV do cenário. Ao editar o preço, a indicação passa a “Editado · ref. P50/P75”, preservando o percentil de origem. As bases de incrementos HUGO e HUGOL não exibem etiquetas nem percentis por solicitação do usuário. Ocupações alteradas mostram a taxa original e a ajustada em “Antes → Atual”; **Restaurar bloco** retorna todos os serviços daquela categoria ao cenário de referência, preservando os outros blocos.

## Produção e ocupação

Quantidades/leitos vêm de H; ocupações ou horas médias, de I; produção/pacientes-dia, de J. São 336 enfermaria (incluindo 18 de PS Observação) e 70 UTI, total de 406. As UTI estão distribuídas em 10, 20, 20, 10 e 10 leitos. O escritório de gestão de altas não integra essa capacidade.

As ocupações de origem são 72%, 76%, 83%, 57% e 120% nas enfermarias/observação e 101%, 99%, 69%, 78% e 95% nas UTI. Elas permanecem editáveis, incluindo valores acima de 100%, em passos de 0,5 ponto percentual. Paciente-dia segue `ROUND(leitos × ocupação × 30,4;0)` e reproduz todos os valores J da fonte. São 937 demais cirurgias, com 2 horas médias e 1.874 horas/mês, além das 30 de alto custo com 180 horas/mês.

O botão “Aplicar ao bloco” altera as ocupações de todas as linhas ativas daquele bloco, inclusive as ocultas por busca. Enfermarias inclui PS Observação. Linhas retiradas, o outro bloco, quantidades, preços e seleções de incrementos são preservados. Na base original desta aba:

- Enfermarias a 80%: R$ 8.723.446,82 no bloco e R$ 26.800.468,01 no total.
- UTI a 90%: R$ 6.325.808,12 no bloco e R$ 26.819.677,14 no total.

O controle existe nas cinco bases financeiras. Estados são independentes; a nova aba salva em `novo-hugo-production-v1`. O comparativo recebe as cinco seleções visíveis atuais e permite escolher esta base como referência. O arquivo gerado registra SHA-256, linhas, células verdes e fórmulas de origem em `production-source.js`; esses dados exigem autenticação.
