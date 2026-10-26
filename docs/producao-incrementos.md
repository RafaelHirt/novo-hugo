# Novo prédio · valores e produção com novos serviços

Fonte: `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26 (3) FINAL.xlsx`, SHA-256 `9839442f103481b2dc0756bd23e5f37363e1a8068fceec8deb24afbce2c2c547`. As seis abas de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL fornecem diretamente a distribuição, as quantidades, os preços e os totais com **Novo HUGO - Taxa de ocupação estimada**. O arquivo FINAL reproduz os mesmos valores financeiros do anexo anterior.

O comando `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis production-increments` gera `production-increments-source.js`. Lê os valores armazenados, confere a fórmula de cada custo estimado na coluna S com o percentil marcado em verde nas colunas M/N/O e verifica a soma em centavos. HUGO - ATUAL também é registrada na fonte para auditoria, com total P71 de R$ 27.719.812,85. Azul e RESUMO não são importadas como cenários.

## Cenários do Novo prédio

Na interface, o cenário anterior aparece primeiro como **Atual HUGO - Taxa de ocupação real**, preservando seus dados e ajustes. Depois dele vêm os seis cenários estimados abaixo, começando por **HUGO - SEM BANCO DE SANGUE**. O usuário corrigiu o valor inicialmente citado e confirmou a preservação da base anterior de **R$ 26.618.281,37**, com seus preços, quantidades, ocupações e ajustes salvos.

| Origem | Cenário | Planilha e dashboard — mensal |
| --- | --- | ---: |
| HUGO - SEM BANCO DE SANGUE | Base, sem serviços adicionais | R$ 29.304.814,03 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 29.550.580,78 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 29.708.188,78 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 29.896.919,98 |
| HUGO - MENOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 30.810.452,48 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 34.170.850,87 |

O Pronto Atendimento usa O23/P75 = R$ 624,80 e 2.588 atendimentos, com S23 = R$ 1.616.982,40, em todas as abas do Novo prédio. As fórmulas agora usam a célula da própria linha. Os valores de contrato das colunas Q/T não são os preços desta opção.

## Serviços e preços disponíveis

| Opção | Quantidade e preço do anexo | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas × R$ 284,33/P50 + 25 plaquetas × R$ 1.300,77/P50 | R$ 245.766,75 |
| Ressonância magnética | 100 exames internos + 300 externos × R$ 394,02/P50 | R$ 157.608,00 |
| SAD | 120 atendimentos × R$ 1.572,76/P50 | R$ 188.731,20 |
| Hemodinâmica | 250 procedimentos × R$ 3.654,13/P75 | R$ 913.532,50 |
| Adequação · Enfermaria (UI) | +35 leitos e SADT correspondente | R$ 1.303.879,20 |
| Adequação · UTI | +20 leitos e SADT correspondente | R$ 2.056.117,27 |

Todos os preços foram fornecidos. Não há campos de custos pendentes nem preços copiados de outra base. As seis caixas são independentes. Hemodinâmica oferece 250 ou 450 procedimentos; 450 usa o mesmo preço unitário e custa R$ 1.644.358,50. O cenário completo com essa alternativa custa R$ 34.901.676,87.

A adequação de UI tem R$ 1.033.043,22 em leitos e R$ 270.835,98 em SADT; a de UTI, R$ 1.905.005,89 em leitos e R$ 151.111,38 em SADT. Juntas acrescentam R$ 3.360.398,39, reproduzindo a planilha. Os efeitos isolados não são somados diretamente: o índice e cada quantidade SADT têm arredondamentos. Índices: 1,09 para UI, 1,05 para UTI e 1,14 para ambas, sempre sobre 406 leitos de referência. A capacidade passa de 336 enfermaria + 70 UTI = 406 para 371 + 90 = 461 quando ambas estão selecionadas.

## Interface e validação

A escolha compacta **Atual HUGO - Taxa de ocupação real / Novo HUGO - Taxa de ocupação estimada** mantém o padrão da base HUGOL. Os serviços adicionais aparecem na opção estimada. Os indicadores usam a base da opção selecionada; na estimada, a variação é calculada a partir de R$ 29.304.814,03 sem adicionais, com 90% nas enfermarias e 95% nas UTI. Cenários prontos ficam recolhidos em **Usar um cenário da planilha**, com a Real primeiro e os Estimados depois. Os rótulos acompanham o comparativo e os CSVs. O bloco duplicado “Cenário atual” não foi reintroduzido.

A fonte registra arquivo, assinatura, abas, células de preços, fórmulas e verdes escolhidos. Todas as 354 linhas do novo arquivo (42 atuais e 52 × 6 do novo prédio), seus sete totais e as 64 combinações de incrementos têm conferência financeira. Os testes verificam também UI/UTI separadas, a alternativa de 450 hemodinâmicas e o comparativo mensal/anual.

O salvamento versão 6 mantém a seleção e os ajustes independentes de cada opção. A atualização dos rótulos preserva integralmente os estados das versões 5 e 6. Edições dos 42 serviços reais de versões anteriores são preservadas. A antiga simulação com preços digitados não pode reaparecer: os serviços do novo anexo têm IDs próprios e preços da fonte. A restauração afeta somente a opção selecionada.
