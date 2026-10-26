# Novo HUGO · Demonstração de custeio

Dashboard em português para demonstração financeira, com acesso por senha validado no servidor. Identidade visual baseada no verde-azulado da SES e no azul do SUS, usando as referências enviadas pelo usuário. As imagens de `assets/` são adaptações das referências do hospital e da identidade institucional, convertidas para WebP e incluídas no próprio site.

## Interface

- Indicadores financeiros e projeção anual, com resumo fixo e compacto durante a rolagem.
- Leitos de enfermaria (UI + PS Observação), UTI e total: inicialmente 336 + 70 = 406. Os 18 de PS Observação integram enfermaria por decisão do usuário; hospital dia e escritório de gestão de altas não entram nessa contagem.
- Busca com ou sem acentos, filtro por categoria e opção de mostrar somente serviços alterados.
- Categorias recolhíveis, destaque das alterações e botão **Restaurar bloco** em cada categoria. Restaura ativação, quantidades, preços e ocupações daquele bloco, inclusive linhas ocultas por busca, preservando outros blocos e os incrementos selecionados.
- Resumo financeiro fixo durante a edição e composição do custeio abaixo dos serviços.
- Indicadores fixos somente no topo durante a rolagem, sem duplicar o resumo na parte inferior.
- Paciente-dia projetado atualizado em cada linha de internação, com base em 30,4 dias por mês.
- Ocupação em passos de 0,5 ponto percentual nas UI, UTI e PS Observação, preservando inclusive ocupações superiores a 100% presentes na fonte.
- Controle de ocupação por bloco nas seis bases: aplica às linhas ativas de Enfermarias ou UTI, preservando o outro bloco. Enfermarias inclui PS Observação; filtros de busca não reduzem o alcance do bloco.
- O campo de ocupação exibe **Digitar %** quando as taxas são diferentes. Linhas ajustadas mostram **Antes → Atual**, usando a ocupação original do cenário selecionado. A comparação permanece visível após recarregar ajustes salvos e desaparece quando o valor volta à referência.
- Referências de preço aparecem em etiquetas com maior contraste: P25 azul, P50 verde, P75 âmbar, sempre com identificação textual. Preços editados mantêm o percentil de origem com indicação de edição. As referências HUGOL e HUGO aparecem novamente na tela, no comparativo e no CSV: percentis confirmados para HUGOL e valor contratual para HUGO.
- Edição em cartões no celular e em tabelas no computador, com navegação por teclado.
- Abas 5º T.A HUGO com bases R$ HUGOL e R$ HUGO: seis opções independentes (UI e UTI separadas) e edição dos serviços em cada base. Sete cenários originais na HUGOL e seis na HUGO.
- Navegação organizada em Aditivo em trâmite, **5º T.A HUGO** (as três abas dentro de um único bloco), Reequilíbrio e Análise. No celular e em telas até 1.100 px, o seletor mantém esses grupos. As bases usam controles compactos, sem valores monetários que possam parecer um cenário completo. HUGO tem uma base de Novo Prédio; os cenários completos permanecem na lista explícita de predefinidos. Teclas de seta, Home e End continuam disponíveis nas abas do computador.
- Fluxo simplificado nas abas do 5º T.A: barra de escolha da base, indicadores financeiros e caixas dos serviços adicionais. O bloco “Cenário atual” foi removido. As bases não usam cartões explicativos grandes; os cenários prontos ficam na opção recolhida “Usar um cenário da planilha”. Edições detalhadas continuam abaixo, nas tabelas.
- Comparativo dos cinco cenários visíveis salvos, com referência escolhida pelo usuário, diferenças em reais e percentual, visão mensal ou anual e filtro de diferenças. Cartões ficam em até três colunas no computador, com tabelas roláveis e categoria fixa. Serviços e quantidades ficam em detalhe opcional, sem coluna de ocupação; percentis de origem aparecem nas linhas que os têm. Exportação do comparativo em CSV.
- Indicador de conexão com animação suave, respeitando a preferência por movimentos reduzidos.
- Sem dependências de imagens, fontes ou scripts externos durante o uso.

## Desenvolvimento

Node.js 20 ou superior. Sem dependências externas de execução. Defina `DASHBOARD_PASSWORD` no ambiente de execução antes de iniciar o servidor; não registre o valor em arquivos versionados ou comandos salvos. Arquivos `.env` estão ignorados pelo Git, mas não são carregados automaticamente por `npm run dev`.

```sh
npm run dev
npm test
npm run build
```

Servidor na porta 3000 (ou `PORT`). Build em `dist`. Os testes usam senhas temporárias aleatórias em memória e não precisam da senha de produção. O servidor local aplica a mesma validação de acesso usada no Netlify.

## Acesso e publicação no Netlify

`netlify.toml` configura o build, o diretório de publicação e a Edge Function `access` para todas as rotas. A senha não faz parte do JavaScript entregue ao navegador nem do build estático.

1. Em **Project configuration → Environment variables**, use exatamente `DASHBOARD_PASSWORD` no campo **Key**. Coloque a senha de acesso no campo de valor de **Production**, separado do nome da variável. Marque **Contains secret values** e mantenha o escopo **Functions**, que inclui Edge Functions. Se a interface exigir valores por contexto, preencha Production e, quando necessário, Deploy Previews.
2. Salve a variável e inicie um novo deploy depois de corrigir a Key ou alterar o valor. A publicação anterior não confirma que a configuração corrigida já está em uso. Um novo envio à branch `main` também aciona o deploy automático do projeto conectado ao GitHub.
3. Confira o login, o acesso ao painel e o botão Sair no site publicado.

Não há nome de usuário. A sessão dura oito horas e usa cookie assinado, HttpOnly, SameSite=Strict e Secure em HTTPS. Alterar a senha invalida as sessões anteriores. Páginas e dados protegidos não podem ser armazenados no cache compartilhado. Sem a variável, o servidor retorna acesso indisponível e mantém os dados bloqueados; erros da Edge Function não liberam arquivos estáticos. Somente as duas imagens institucionais e o script de apresentação do login são públicos. Há limitação de tentativas de login por IP em cada instância da função.

A autenticação foi verificada no servidor local e no adaptador da Edge Function; a confirmação no Netlify exige a variável e um deploy na plataforma.

Se aparecer **Acesso indisponível** depois de cadastrar a senha, confira o nome exato `DASHBOARD_PASSWORD`, o valor no contexto Production e o escopo Functions. Inicie um novo deploy após salvar a variável e aguarde essa nova publicação concluir. O deploy feito antes da alteração pode continuar usando a configuração anterior. No login, utilize a senha atualmente cadastrada em Production.

## Dados e cálculos

`data.js` transcreve os dados da imagem HOSPITAL: HUGO — 4º TA ao TC 97/2024. Referência mensal: R$ 27.261.236,24. Identificação no dashboard: 4º Termo Aditivo em trâmite. A soma das linhas foi conferida em centavos e coincide com o total da imagem. Internação (enfermarias + UTI): R$ 15.077.012,05.

Nas linhas de internação, incluindo PS Observação, a projeção segue as imagens da planilha: `paciente-dia = arredondar(leitos × ocupação / 100 × 30,4)`; o custo mensal da linha é `paciente-dia × custo unitário`. O arredondamento para inteiro ocorre antes da multiplicação pelo custo unitário. A ocupação é percentual de 0 a 100. Exemplo: 90 leitos × 80% × 30,4 = 2.188,8, arredondados para 2.189 pacientes-dia; × R$ 999,23 = R$ 2.187.314,47. Essa regra também reproduz todos os pacientes-dia e custos originais das dez linhas de internação. Usar a proporção sobre o total original produziria R$ 2.186.759,34 nesse exemplo, por reaproveitar o paciente-dia já arredondado da referência.

Nos demais serviços, os totais da imagem permanecem como base: total original × quantidade atual / original × custo unitário atual / original; em cirurgias, também × horas médias atuais / originais. Os totais gerais somam as linhas em centavos. O cálculo de paciente-dia é compartilhado pelo resumo, pelos totais por categoria e pelo comparativo; os ajustes já salvos no navegador são reaplicados com essa fórmula.

Na UTI, a mesma regra vale para as cinco linhas: 10 leitos × 80% × 30,4 = 243,2, arredondados para 243 pacientes-dia; × R$ 3.069,99 = R$ 746.007,57. Para 20 leitos a 80%, são 486 pacientes-dia e R$ 1.492.015,14.

A função `bedTotals` soma UI e PS Observação na enfermaria e mantém UTI separada, considerando apenas linhas ativas e suas quantidades ajustadas, independentemente da ocupação. A base inicial é 318 UI + 18 PS Observação = 336 enfermaria, mais 70 UTI, totalizando 406. Nas bases do novo prédio, as quantidades distribuídas na planilha já somam 336; o desconto anterior de 18 foi removido, sem acrescentá-los novamente ou alterar o custeio. Hospital dia e escritório de gestão de altas não entram nos indicadores de internação. Valores são mensais; o anual projeta 12 meses iguais. O modelo estima o custeio pela produção e não separa custos fixos e variáveis.

Valores monetários usam o padrão brasileiro (R$ 1.234,56), com duas casas decimais e totais somados em centavos. Custos unitários podem ser digitados com vírgula decimal ou colados com R$. O CSV usa ponto e vírgula como separador, vírgula decimal e duas casas nos valores monetários.

Os ajustes da 4 T.A (Atual), da base R$ HUGOL, da base R$ HUGO, da atualização de valores, da atualização de valores e produção e do Reequilíbrio ficam em seis chaves distintas do localStorage e podem ser restaurados ou exportados em CSV. O comparativo acompanha esses estados; seus filtros não alteram os cenários nem os totais gerais.

## Incrementos com base R$ HUGOL

Fonte atual: `01 NOVO HUGO - BASE HUGOL.xlsx`. São importadas somente as sete abas de HUGO - BASE HUGOL até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não são fontes de cenários. A importação lê valores já calculados, sem executar fórmulas, e registra o SHA-256. O arquivo completo não é publicado.

A nova planilha inclui a UI Cirúrgica do 2º andar no subtotal financeiro (`P12 = SUM(P6:P11)`). O cenário Novo Prédio - Base é R$ 27.383.612,79 e o completo, R$ 32.041.004,33, usando os 250 procedimentos originais de hemodinâmica. Todos os sete totais e suas linhas foram conferidos em centavos.

Banco de sangue, ressonância, SAD, hemodinâmica, adequação de enfermaria e adequação de UTI formam seis opções independentes. A hemodinâmica oferece 250 ou 450 procedimentos mensais: 450 × R$ 4.466,94 = R$ 2.010.123,00. O seletor usa o custo unitário atual da linha e acompanha alterações manuais. O comparativo mostra o volume selecionado.

A adequação de enfermaria acrescenta 35 UI; a de UTI, 20 leitos. Os cartões mostram o acréscimo financeiro da opção isolada e distinguem custo dos leitos e ajuste de SADT. O SADT acompanha a fórmula da planilha: índice de leitos arredondado a duas casas, seguido do arredondamento da quantidade de cada serviço. Os efeitos conjuntos podem diferir da soma dos efeitos isolados por causa desses arredondamentos; com ambas as opções, o cenário final coincide com o arquivo.

A capacidade inicial das bases do novo prédio é 336 enfermaria + 70 UTI = 406; somente UI ampliada resulta em 441, somente UTI em 426 e ambas em 461. As quantidades usadas no custeio permanecem iguais às da planilha. A seleção antiga de adequação é migrada para as duas opções, preservando outros ajustes salvos. Alternar uma opção de leitos restaura suas linhas e as linhas de SADT relacionadas, preservando os demais serviços.

Confira [os totais, os incrementos e as fórmulas](docs/hugol-conferencia.md). `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis hugol` reproduz `hugol-source.js`, usando `openpyxl` somente durante a importação.

Os percentis HUGOL foram conferidos com a imagem corrigida fornecida pelo usuário em 24/10/2026, substituindo a anterior. A coluna verde está transcrita por serviço em `scripts/hugol-image-reference.json`. Depois da importação financeira, execute `python scripts/import-hugol-image-references.py /caminho/arquivo.xlsx` para aplicar as referências e gerar [a conferência linha a linha](docs/hugol-percentis-conferencia.md). O script valida a assinatura do arquivo e os vínculos explícitos de preços do SADT externo. Mantém os valores financeiros: 46 das 52 linhas do novo prédio conferem, gestão de altas diverge e cinco linhas não constam na imagem. A conferência da imagem permanece no registro técnico. As referências foram restauradas a pedido do usuário, na tela, no comparativo e no CSV: HUGOL usa o P confirmado na imagem; HUGO identifica o valor contratual. Serviços sem referência explícita permanecem sem P inferido. A correção posterior em `hugol-model.js` aplica R$ 4.948,21 à gestão de altas, mantendo o arquivo importado intacto; os totais passam a R$ 25.963.506,96 na base sem aumento, R$ 27.381.560,79 no Novo Prédio - Base e R$ 32.038.952,33 no completo com 250 hemodinâmicas.

## Incrementos com base R$ HUGO

Fonte atual: `02 NOVO HUGO - BASE HUGO VIGENTE (3).xlsx`, das seis abas de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não são fontes desta importação.

A revisão inclui a UI do 2º andar no subtotal (`P12 = SUM(P6:P11)`): R$ 28.665.201,56 sem incrementos e R$ 33.469.980,97 no cenário completo com 250 hemodinâmicas. Com 450, o completo passa a R$ 34.363.368,97. Os seis cenários originais fecham em centavos. A interface já oferece as adequações separadas, capacidade inicial de 336 enfermaria (UI + PS Observação) e opção de 450 hemodinâmicas, com estados e salvamento separados da base HUGOL.

As abas do novo prédio usam `ROUNDUP` para paciente-dia (leitos × ocupação × 30,4). A base HUGOL sem aumento e a 4 T.A (Atual) usam o arredondamento ao inteiro mais próximo. Cirurgias do novo prédio preservam horas fracionadas. As bases de incremento e de atualização compartilham `increment-model.js` e `hugol-ui.js`.

Confira [a conferência da fonte HUGO](docs/hugo-conferencia.md). `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis hugo` reproduz `hugo-source.js` a partir do arquivo correspondente. As 64 combinações de cada base, a opção de 450 e a migração dos ajustes salvos têm testes.

## Atualização de valores (oculta)

A aba Ago/25 - Jul/26 foi ocultada da navegação e do comparativo por solicitação do usuário. Seus dados e ajustes salvos continuam separados. Links antigos `#hugo-updated` direcionam à aba de valores e produção.

A fonte `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26.xlsx` permanece intacta em `updated-source.js`. A correção explícita em `updated-model.js` troca o Pronto Atendimento de R$ 1.175,34 para **P75 = R$ 624,80**, usando M22 na base atual e O23 no novo prédio. Para os 2.588 atendimentos, a linha passa de R$ 3.041.779,92 a R$ 1.616.982,40. A diferença é R$ 1.424.797,52/mês em cada cenário. A base corrigida custa R$ 27.719.812,85; o Novo Prédio - Base, R$ 29.304.814,03. Os demais preços e quantitativos são preservados. A conferência mostra os totais do arquivo e a correção aplicada.

Confira [a conferência da atualização](docs/atualizacao-conferencia.md). `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis updated` reproduz a importação original; correções explícitas permanecem no modelo.

## Atualização valores e produção

A aba **5º T.A HUGO - Atualização valores e produção** permite escolher **Prédio atual** e **Novo prédio** em uma barra compacta. O prédio atual mantém `HUGO - ATUAL` do arquivo `06 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - agosto25 a julho26 (3).xlsx`, com **R$ 26.618.281,37/mês** (P71), 336 enfermaria + 70 UTI = 406 leitos. Suas 42 linhas preservam a produção H/J, as ocupações I e os custos escolhidos em verde: 34 linhas P50 e 8 P75. A importação verifica cada célula verde contra a fórmula P; Azul não é importada como cenário.

O paciente-dia segue `ROUND(leitos × ocupação × 30,4;0)`, inclusive os 120% do PS Observação e os 101% da UTI Adulto 1. Horas cirúrgicas também são arredondadas ao inteiro conforme a fonte. A ocupação pode ser editada por linha ou por bloco em passos de 0,5; aplicar ao bloco modifica somente linhas ativas e mantém quantidades e preços. O percentil aparece abaixo de cada custo unitário, no detalhe do comparativo e no CSV. Preços editados são identificados como edição com percentil de origem; valores contratuais das bases antigas não recebem um percentil inferido.

O Novo prédio agora usa diretamente as seis abas de cenários do anexo `04 NOVO HUGO - BASE HUGO Custo atualizados - agosto25 a julho26 (3).xlsx`, coluna **S — Custo Total Estimado**, com base sem adicionais de **R$ 29.304.814,03**. Há seis opções independentes: banco de sangue, ressonância, SAD, hemodinâmica 250/450, +35 enfermaria e +20 UTI com o SADT correspondente. Todos os preços e percentis vêm das células verdes e fórmulas dessa fonte, sem preços pendentes ou cruzamento de quantitativos com outra planilha. O cenário completo com 250 hemodinâmicas custa **R$ 34.170.850,87**; com 450, **R$ 34.901.676,87**. O PA é R$ 624,80 em ambos os prédios. O anexo também registra HUGO - ATUAL a R$ 27.719.812,85 para auditoria; ele não substitui a base de produção de R$ 26.618.281,37 já existente. Confira [os incrementos e suas fontes](docs/producao-incrementos.md).

O armazenamento `novo-hugo-production-v1` usa versão 5 e mantém ajustes independentes por prédio. A migração preserva os 42 serviços reais e recupera seu rascunho nas versões antigas; os preços digitados na antiga simulação descartada não podem reaparecer. Novos serviços usam IDs próprios. A abertura inicial continua no prédio atual; restaurar afeta somente o prédio selecionado. O comparativo e o CSV acompanham o prédio e os serviços efetivamente selecionados. `python scripts/import-production.py /caminho/arquivo.xlsx` reproduz `production-source.js`; `python scripts/import-hugol.py /caminho/novo-anexo.xlsx --basis production-increments` reproduz `production-increments-source.js`. Confira [a conferência de valores e produção](docs/producao-conferencia.md).

## Reequilíbrio · Jan/25 - Dez/25

A aba **Reequilíbrio - Atualização valores e produção Jan/25 - Dez/25** usa somente `HUGO - ATUAL (PS 75%)` do arquivo `08 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - janeiro a dezembro 2025 (redução de leitos) (5).xlsx`, conforme escolha do usuário. Azul e HUGO - ATUAL (PS R$ 1175,34) não são importadas. O total P70 é **R$ 24.122.514,56/mês**, ou R$ 289.470.174,72/ano. A redução resulta em 306 enfermaria (incluindo 18 de PS Observação) + 60 UTI = 366 leitos; há quatro linhas de UTI.

As 41 linhas preservam quantidades, ocupação, produção e preços da fonte. O Pronto Atendimento usa 2.770 atendimentos × R$ 600,15 (P75), somando R$ 1.662.415,50/mês. Os 34 preços P50 e 7 P75 são conferidos pelas fórmulas; 38 linhas têm seleção verde e três têm preenchimento rosa uniforme, com P50 identificado pela fórmula: Ecodoppler interno, externo e gestão de altas. O Ecodoppler interno tem produção zero e é mantido na lista sem custo inicial.

O controle de ocupação por bloco, os ajustes por linha, a restauração e o CSV usam as mesmas regras da aba de produção. O salvamento é independente em `novo-hugo-rebalance-v1`, e o comparativo acompanha suas alterações. `python scripts/import-production.py /caminho/arquivo.xlsx --basis rebalance --sheet 'HUGO - ATUAL (PS 75%)'` reproduz `rebalance-source.js`. Confira [a conferência do Reequilíbrio](docs/reequilibrio-conferencia.md).

## Referências dos incrementos com base R$ HUGO

As abas dos incrementos usam a coluna M, identificada como **Valor Contrato HUGO**, e não apresentam P25/P50/P75. As 52 linhas mostram novamente **Valor contratual**, inclusive no CSV e no comparativo, sem atribuir percentis que não existem na fonte. A igualdade numérica com preços da aba HUGO - ATUAL não é tratada como evidência de percentil para os incrementos.

`02 NOVO HUGO - BASE HUGO VIGENTE CORRETA.xlsx` confere essas referências, sem substituir quantidades, preços ou totais financeiros. `python scripts/import-hugo-references.py /caminho/arquivo.xlsx` valida a coluna M nas seis abas dos cenários e registra a origem em `contractReference` de `hugo-source.js`. A classificação anterior por correspondência de preços foi removida. Os totais originais dos seis cenários permanecem conferidos.
