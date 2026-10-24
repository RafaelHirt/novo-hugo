# Novo Prédio com valores e produção atualizados

Os dois cartões de escolha da aba Ago/25 - Jul/26 oferecem a base atual de 42 serviços (R$ 26.618.281,37/mês) e **Novo Prédio + serviços** (52 linhas, R$ 29.304.814,03/mês sem incrementos). A opção de novo prédio foi confirmada pelo usuário; a base original e seus ajustes foram preservados.

## Fontes e preços

- Quantitativos, distribuição, ocupação de referência e incrementos: Novo Prédio da base HUGO (`02 NOVO HUGO - BASE HUGO VIGENTE (3).xlsx`).
- Custos unitários e percentis: os serviços já importados de `HUGO - ATUAL` do arquivo `06 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - agosto25 a julho26 (3).xlsx`.
- O mapeamento explícito por linha está em `production-model.js`. Cada preço conhecido registra arquivo, aba, linha e célula de origem; as quantidades têm sua própria origem. São 46 linhas com preço conhecido e seis linhas sem preço (cinco serviços distintos).

UI médicas e cirúrgicas gerais usam o preço atualizado de R$ 1.079,46/P50. As três UTI adultas usam R$ 3.301,57/P75. Pronto Atendimento usa R$ 624,80/P75. As cirurgias de alto custo usam R$ 3.117,87/P75 e as demais, R$ 2.394,43/P50. As linhas externas de ecocardiograma e raio X usam os preços dos mesmos exames internos da base de produção. A gestão de altas nesta base mantém R$ 5.153,41/P50; a correção de R$ 4.948,21 foi solicitada somente para a base HUGOL.

Os leitos do novo prédio usam arredondamento de paciente-dia para cima e ocupação de referência de 90% em enfermarias e 95% em UTI, como os outros cenários de novo prédio. As cirurgias preservam horas fracionadas. A base atual original mantém suas ocupações e o arredondamento da planilha.

## Custos pendentes

| Serviço | Quantidade do incremento | Preço atualizado |
| --- | ---: | --- |
| Bolsa de sangue total | 750 bolsas/mês | A informar |
| Plaquetas por aférese | 25 bolsas/mês | A informar |
| Ressonância magnética | 100 exames internos + 300 externos/mês | A informar |
| Atendimento domiciliar (SAD) | 120 atendimentos/mês | A informar |
| Hemodinâmica | 250 ou 450 procedimentos/mês | A informar |

Esses preços permanecem `null`, sem usar os preços HUGOL, contratuais ou da aba oculta. Os cartões apresentam **Custo a informar** e um editor recolhido em “Informar custos unitários”, com campos para o usuário fornecer os valores. Banco de sangue exige seus dois preços; o campo de ressonância abastece as duas linhas. A caixa do incremento só é liberada depois que seus preços estiverem informados. **Selecionar disponíveis** inclui somente opções com todos os custos definidos. Valores explicitamente informados como zero são aceitos; ausência de informação não equivale a zero.

Os preços informados são salvos neste navegador e identificados como **Informado para simulação**, sem inferir P. Alternar o incremento preserva esses preços e restaura seu volume de referência. Restaurar um bloco com preço originalmente ausente mantém o preço informado e restaura seus outros campos. A restauração do cenário de Novo Prédio limpa também esses preços, preservando os ajustes da base atualizada. A validação do modelo rejeita seleções ativas com custos pendentes.

## Adequações de leitos

| Opção | Leitos | Custo direto mensal | SADT isolado | Acréscimo isolado |
| --- | ---: | ---: | ---: | ---: |
| Enfermaria | +35 | R$ 1.033.043,22 | R$ 270.835,98 | R$ 1.303.879,20 |
| UTI | +20 | R$ 1.905.005,89 | R$ 151.111,38 | R$ 2.056.117,27 |

A base tem 336 enfermaria + 70 UTI = 406 leitos. Com UI, são 441; com UTI, 426; com ambas, 461. O ajuste de SADT usa as mesmas fórmulas e arredondamentos das outras bases: índice de leitos arredondado a duas casas, depois quantidade de cada linha arredondada ao inteiro. Com ambas, o acréscimo conjunto é R$ 3.360.398,39; a soma dos efeitos isolados pode diferir por arredondamento.

| Seleção, sem incrementos de serviços | Total mensal |
| --- | ---: |
| Novo Prédio - Base | R$ 29.304.814,03 |
| Somente adequação de enfermaria | R$ 30.608.693,23 |
| Somente adequação de UTI | R$ 31.360.931,30 |
| Ambas as adequações | R$ 32.665.212,42 |

O total com serviços adicionais depende dos preços que ainda serão informados. A conferência com a planilha continua verificando apenas os 42 serviços originais, pois o novo prédio é uma simulação composta a partir das duas fontes. O comparativo acompanha a base e os incrementos selecionados; a aba de Atualização de valores está oculta também no comparativo.

## Salvamento e validação

O armazenamento `novo-hugo-production-v1` usa a versão 3. Os dois cartões de escolha mantêm rascunhos separados por base em `drafts`. Alternar e recarregar preservam os dois cenários; a restauração geral limpa apenas a possibilidade ativa, mantendo a outra. A migração reconhece a antiga base `new` de 42 serviços e a transforma em `same`, preservando todas as edições; a nova base `new` de 52 linhas tem IDs próprios. Dados das demais abas permanecem separados.

Os testes verificam os preços e as quantidades de cada fonte, ausência de preços inventados, seleção bloqueada sem custo, as 64 combinações com preços explicitamente fornecidos dentro do teste, hemodinâmica 250/450, restauração, migração e integração mensal/anual com o comparativo.
