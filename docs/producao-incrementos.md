# Novo prédio · valores e produção com novos serviços

Fonte: `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26 (3) FINAL.xlsx`, SHA-256 `9839442f103481b2dc0756bd23e5f37363e1a8068fceec8deb24afbce2c2c547`. As seis abas de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL fornecem diretamente a distribuição, as quantidades, os preços e os totais com **Novo HUGO - Taxa de ocupação estimada**. O arquivo FINAL reproduz os mesmos valores financeiros do anexo anterior.

## Correções autorizadas em 11/11/2026

Somente na opção **Novo HUGO - Taxa de ocupação estimada**, o Pronto Atendimento passa a **3.000 atendimentos fixos por mês**, mantendo R$ 624,80 por atendimento e totalizando **R$ 1.874.400,00/mês**. O campo de quantidade fica somente para leitura; edições antigas de quantidade não se sobrepõem ao valor fixo.

O Escritório de gestão de altas mantém as **10 unidades**, com custo unitário de **R$ 6.670,06** e total de **R$ 66.700,60/mês**, conforme esclarecimento do usuário. O preço vem de `09 Matriz de Custeio HUGO - Produção e custo atualizados - Manifestação GEC (5).xlsx`, aba `HUGO - 1º TA!N70`. A quantidade de 5 unidades do anexo não foi adotada.

As duas primeiras correções acrescentaram **R$ 272.584,10/mês** a cada cenário estimado da importação original: R$ 257.417,60 no PA e R$ 15.166,50 no Escritório. Nessa etapa, a base passou a R$ 29.577.398,13. O HUGO atual de R$ 26.618.281,37 e todos os acréscimos dos serviços adicionais foram preservados. A atualização posterior do SADT está descrita abaixo.

O arquivo gerado `production-increments-source.js` permanece intacto. As correções são aplicadas em `production-model.js`, mantendo os valores originais para auditoria. Os quadros financeiros abaixo documentam a importação original; a conferência na interface identifica a diferença autorizada em relação a ela. A versão 7 do salvamento aplica as correções também aos rascunhos antigos de PA e Escritório, preserva os demais ajustes e mantém os rascunhos do HUGO atual. Novas edições do Escritório feitas na versão 7 são preservadas.

## Quantitativos do SADT conforme Manifestação GEC (5)

A atualização de quantidades aplica-se somente aos serviços presentes tanto no **Novo HUGO** quanto na planilha GEC (5): **19 internos e 5 externos**. A lista original de 52 serviços é preservada. A Endoscopia de vias urinárias, existente somente na planilha, não é incluída. Ecocardiograma externo (40 exames) e Raio X externo (150 exames), presentes somente no Novo HUGO, mantêm suas quantidades e preços originais. Ressonância interna e externa continuam disponíveis pelo adicional existente.

A fonte é a aba `HUGO - 1º TA`, coluna J, de `09 Matriz de Custeio HUGO - Produção e custo atualizados - Manifestação GEC (5).xlsx`, SHA-256 `c57e05cce4723bdfe08ba7e3910f2d5c2504f4ed1cec29ff6675436264fa56d6`. `python scripts/import-production-sadt.py /caminho/arquivo.xlsx` gera `production-sadt-source.js` com as 24 correspondências, verifica preços, fórmulas, percentis verdes e registra a linha ignorada apenas para auditoria. Os preços dos serviços existentes permanecem iguais.

Na base sem adicionais, o SADT interno totaliza **R$ 4.233.876,51** e o externo **R$ 202.493,90**, incluindo os dois serviços originais sem correspondência no anexo. A atualização de quantitativos acrescenta **R$ 662.173,87** à etapa anterior de PA e Escritório. A diferença total sobre a importação original é **R$ 934.757,97**; a base fica em **R$ 30.239.572,00**, o completo com 250 hemodinâmicas em **R$ 35.105.608,84** e o completo com 450 em **R$ 35.836.434,84**. São 52 linhas, sendo 46 ativas sem adicionais.

Os valores dos seis adicionais permanecem preservados conforme solicitação anterior. Nas adequações de leitos, mantém-se o aumento de produção SADT de cada pacote original, somado às novas quantidades base. As opções isoladas e a seleção conjunta conservam seus valores e seus arredondamentos. Não se reaplica o índice proporcional à base revisada, pois isso alteraria os acréscimos autorizados. As 64 combinações são verificadas com essa regra.

O salvamento passa à versão 8. Rascunhos anteriores do Novo HUGO recebem as novas quantidades; os preços editados, os demais serviços, a seleção de adicionais e o rascunho do HUGO atual são mantidos. A migração descarta o ID da Endoscopia de vias urinárias incluída indevidamente, inclusive nos rascunhos da versão 8. As linhas originais sem correspondência no anexo permanecem disponíveis. Restauração de bloco e de base recupera os novos quantitativos.

O comando `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis production-increments` gera `production-increments-source.js`. Lê os valores armazenados, confere a fórmula de cada custo estimado na coluna S com o percentil marcado em verde nas colunas M/N/O e verifica a soma em centavos. HUGO - ATUAL também é registrada na fonte para auditoria, com total P71 de R$ 27.719.812,85. Azul e RESUMO não são importadas como cenários.

## Cenários do Novo prédio

Na interface, o cenário anterior aparece primeiro como **Atual HUGO - Taxa de ocupação real**, preservando seus dados e ajustes. Depois dele vêm os seis cenários estimados abaixo, começando por **HUGO - SEM BANCO DE SANGUE**. O usuário corrigiu o valor inicialmente citado e confirmou a preservação da base anterior de **R$ 26.618.281,37**, com seus preços, quantidades, ocupações e ajustes salvos.

| Origem | Cenário | Importação original — mensal |
| --- | --- | ---: |
| HUGO - SEM BANCO DE SANGUE | Base, sem serviços adicionais | R$ 29.304.814,03 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 29.550.580,78 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 29.708.188,78 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 29.896.919,98 |
| HUGO - MENOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 30.810.452,48 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 34.170.850,87 |

Na importação original, o Pronto Atendimento usa O23/P75 = R$ 624,80 e 2.588 atendimentos, com S23 = R$ 1.616.982,40, em todas as abas do Novo prédio. A correção posterior fixa a quantidade em 3.000. As fórmulas da fonte usam a célula da própria linha. Os valores de contrato das colunas Q/T não são os preços desta opção.

## Serviços e preços disponíveis

| Opção | Quantidade e preço do anexo | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas × R$ 284,33/P50 + 25 plaquetas × R$ 1.300,77/P50 | R$ 245.766,75 |
| Ressonância magnética | 100 exames internos + 300 externos × R$ 394,02/P50 | R$ 157.608,00 |
| SAD | 120 atendimentos × R$ 1.572,76/P50 | R$ 188.731,20 |
| Hemodinâmica | 250 procedimentos × R$ 3.654,13/P75 | R$ 913.532,50 |
| Adequação · Enfermaria (UI) | +35 leitos e SADT correspondente | R$ 1.303.879,20 |
| Adequação · UTI | +20 leitos e SADT correspondente | R$ 2.056.117,27 |

Todos os preços foram fornecidos. Não há campos de custos pendentes nem preços copiados de outra base. As seis caixas são independentes. Hemodinâmica oferece 250 ou 450 procedimentos; 450 usa o mesmo preço unitário e custa R$ 1.644.358,50. Após as correções autorizadas de PA, Escritório e SADT, o cenário completo com essa alternativa custa R$ 35.836.434,84.

A adequação de UI tem R$ 1.033.043,22 em leitos e R$ 270.835,98 em SADT; a de UTI, R$ 1.905.005,89 em leitos e R$ 151.111,38 em SADT. Juntas acrescentam R$ 3.360.398,39, reproduzindo a planilha. Os efeitos isolados não são somados diretamente: o índice e cada quantidade SADT têm arredondamentos. Índices: 1,09 para UI, 1,05 para UTI e 1,14 para ambas, sempre sobre 406 leitos de referência. A capacidade passa de 336 enfermaria + 70 UTI = 406 para 371 + 90 = 461 quando ambas estão selecionadas.

## Interface e validação

A escolha compacta **Atual HUGO - Taxa de ocupação real / Novo HUGO - Taxa de ocupação estimada** mantém o padrão da base HUGOL. Os serviços adicionais aparecem na opção estimada. Os indicadores usam a base da opção selecionada; na estimada, a variação é calculada a partir de R$ 30.239.572,00 sem adicionais, com 90% nas enfermarias e 95% nas UTI. Cenários prontos ficam recolhidos em **Usar um cenário da planilha**, com a Real primeiro e os Estimados depois. Os rótulos acompanham o comparativo e os CSVs. O bloco duplicado “Cenário atual” não foi reintroduzido.

A fonte registra arquivo, assinatura, abas, células de preços, fórmulas e verdes escolhidos. Todas as 354 linhas do novo arquivo (42 atuais e 52 × 6 do novo prédio), seus sete totais e as 64 combinações de incrementos têm conferência financeira. Os testes verificam também UI/UTI separadas, a alternativa de 450 hemodinâmicas e o comparativo mensal/anual.

O salvamento versão 8 mantém a seleção e os ajustes independentes de cada opção, com a migração pontual das correções descrita acima. Edições dos 42 serviços reais de versões anteriores são preservadas. A antiga simulação com preços digitados não pode reaparecer: os serviços do novo anexo têm IDs próprios e preços da fonte. A restauração afeta somente a opção selecionada.
