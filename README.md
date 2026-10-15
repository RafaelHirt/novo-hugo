# Novo HUGO · Demonstração de custeio

Dashboard em português para demonstração financeira, com acesso por senha validado no servidor. Identidade visual baseada no verde-azulado da SES e no azul do SUS, usando as referências enviadas pelo usuário. As imagens de `assets/` são adaptações das referências do hospital e da identidade institucional, convertidas para WebP e incluídas no próprio site.

## Interface

- Indicadores financeiros e projeção anual, com resumo fixo e compacto durante a rolagem.
- Leitos de enfermaria (somente UI), UTI e total: originalmente 318 + 70 = 388. PS Observação participa do custeio, mas nunca dos indicadores de leitos, inclusive nas próximas bases de cenário.
- Busca com ou sem acentos, filtro por categoria e opção de mostrar somente serviços alterados.
- Categorias recolhíveis, destaque das alterações e restauração de valores por serviço.
- Resumo financeiro fixo durante a edição e composição do custeio abaixo dos serviços.
- Indicadores fixos somente no topo durante a rolagem, sem duplicar o resumo na parte inferior.
- Paciente-dia projetado atualizado em cada linha de internação, com base em 30,4 dias por mês.
- Ocupação de 0% a 100%, com controles em passos de 0,5 ponto percentual nas UI, UTI e PS Observação.
- Edição em cartões no celular e em tabelas no computador, com navegação por teclado.
- Abas 5º T.A HUGO com bases R$ HUGOL e R$ HUGO: seis opções independentes (UI e UTI separadas) e edição dos serviços em cada base. Sete cenários originais na HUGOL e seis na HUGO.
- Comparativo dos três cenários salvos, com referência escolhida pelo usuário, diferenças em reais e percentual, visão mensal ou anual e filtro de diferenças. Os cartões mostram os incrementos selecionados e a capacidade de leitos. Serviços e quantidades ficam em detalhe opcional, sem coluna de ocupação; exportação do comparativo em CSV.
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

A função `bedTotals` soma UI e UTI ativas, independentemente da ocupação. Nos cenários do novo prédio, a capacidade física de enfermaria parte de 318 leitos, conforme orientação do usuário, e acompanha os acréscimos de UI; a distribuição financeira de 336 posições da planilha permanece no cálculo de custeio. Assim, o ajuste de capacidade não altera valores, ocupação ou paciente-dia. Na base original são 318 UI + 70 UTI = 388 leitos. Os 18 lugares de PS Observação, Hospital dia e escritório de gestão de altas não entram nos indicadores de leitos; seus serviços continuam no cálculo financeiro. A planilha original exibe 406 por incluir PS Observação. Sua transcrição e seus totais financeiros foram preservados. Valores são mensais; o anual é uma projeção de 12 meses iguais. O modelo estima o custeio pela produção e não separa custos fixos e variáveis.

Valores monetários usam o padrão brasileiro (R$ 1.234,56), com duas casas decimais e totais somados em centavos. Custos unitários podem ser digitados com vírgula decimal ou colados com R$. O CSV usa ponto e vírgula como separador, vírgula decimal e duas casas nos valores monetários.

Os ajustes da 4 T.A (Atual), da base R$ HUGOL e da base R$ HUGO ficam em três chaves distintas do localStorage e podem ser restaurados ou exportados em CSV. O comparativo acompanha esses estados; seus filtros não alteram os cenários nem os totais gerais.

## Incrementos com base R$ HUGOL

Fonte atual: `01 NOVO HUGO - BASE HUGOL.xlsx`. São importadas somente as sete abas de HUGO - BASE HUGOL até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não são fontes de cenários. A importação lê valores já calculados, sem executar fórmulas, e registra o SHA-256. O arquivo completo não é publicado.

A nova planilha inclui a UI Cirúrgica do 2º andar no subtotal financeiro (`P12 = SUM(P6:P11)`). O cenário sem incrementos é R$ 27.383.612,79 e o completo, R$ 32.041.004,33, usando os 250 procedimentos originais de hemodinâmica. Todos os sete totais e suas linhas foram conferidos em centavos.

Banco de sangue, ressonância, SAD, hemodinâmica, adequação de enfermaria e adequação de UTI formam seis opções independentes. A hemodinâmica oferece 250 ou 450 procedimentos mensais: 450 × R$ 4.466,94 = R$ 2.010.123,00. O seletor usa o custo unitário atual da linha e acompanha alterações manuais. O comparativo mostra o volume selecionado.

A adequação de enfermaria acrescenta 35 UI; a de UTI, 20 leitos. Os cartões mostram o acréscimo financeiro da opção isolada e distinguem custo dos leitos e ajuste de SADT. O SADT acompanha a fórmula da planilha: índice de leitos arredondado a duas casas, seguido do arredondamento da quantidade de cada serviço. Os efeitos conjuntos podem diferir da soma dos efeitos isolados por causa desses arredondamentos; com ambas as opções, o cenário final coincide com o arquivo.

A capacidade física inicial das duas bases é 318 UI + 70 UTI = 388; somente UI ampliada resulta em 423, somente UTI em 408 e ambas em 443. As quantidades usadas no custeio permanecem iguais às da planilha. A seleção antiga de adequação é migrada para as duas opções, preservando outros ajustes salvos. Alternar uma opção de leitos restaura suas linhas e as linhas de SADT relacionadas, preservando os demais serviços.

Confira [os totais, os incrementos e as fórmulas](docs/hugol-conferencia.md). `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis hugol` reproduz `hugol-source.js`, usando `openpyxl` somente durante a importação.

## Incrementos com base R$ HUGO

Fonte atual: `02 NOVO HUGO - BASE HUGO VIGENTE (3).xlsx`, das seis abas de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não são fontes desta importação.

A revisão inclui a UI do 2º andar no subtotal (`P12 = SUM(P6:P11)`): R$ 28.665.201,56 sem incrementos e R$ 33.469.980,97 no cenário completo com 250 hemodinâmicas. Com 450, o completo passa a R$ 34.363.368,97. Os seis cenários originais fecham em centavos. A interface já oferece as adequações separadas, capacidade física de 318 UI e opção de 450 hemodinâmicas, com estados e salvamento separados da base HUGOL.

As abas do novo prédio usam `ROUNDUP` para paciente-dia (leitos × ocupação × 30,4). A base HUGOL sem aumento e a 4 T.A (Atual) usam o arredondamento ao inteiro mais próximo. Cirurgias do novo prédio preservam horas fracionadas. As duas bases de incremento compartilham `increment-model.js` e `hugol-ui.js`.

Confira [a conferência da fonte HUGO](docs/hugo-conferencia.md). `python scripts/import-hugol.py /caminho/arquivo.xlsx --basis hugo` reproduz `hugo-source.js` a partir do arquivo correspondente. As 64 combinações de cada base, a opção de 450 e a migração dos ajustes salvos têm testes.
