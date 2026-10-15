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
- Abas T.A Atual, 5º T.A HUGO - Incremento de serviços (Base R$ HUGOL), 5º T.A HUGO - Incremento de serviços (Base R$ HUGO) e Comparativo. As duas bases do 5º T.A aguardam os dados de incremento.
- Aba Comparativo com os três cenários, resumo por categoria e serviços detalhados opcionais, sem coluna de ocupação. A coluna T.A Atual acompanha os serviços ativos, as quantidades e os custos editados, incluindo o efeito da ocupação. Os valores das duas bases do 5º T.A permanecem pendentes até o recebimento dos dados.
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

A contagem de leitos usa a mesma função `bedTotals` em qualquer base: soma apenas UI e UTI ativas, com suas quantidades ajustadas, independentemente da ocupação. Na base original são 318 UI + 70 UTI = 388 leitos. Os 18 lugares de PS Observação, Hospital dia e escritório de gestão de altas não entram nos indicadores de leitos; seus serviços continuam no cálculo financeiro. A planilha original exibe 406 por incluir PS Observação. Sua transcrição e seus totais financeiros foram preservados. Valores são mensais; o anual é uma projeção de 12 meses iguais. O modelo estima o custeio pela produção e não separa custos fixos e variáveis.

Valores monetários usam o padrão brasileiro (R$ 1.234,56), com duas casas decimais e totais somados em centavos. Custos unitários podem ser digitados com vírgula decimal ou colados com R$. O CSV usa ponto e vírgula como separador, vírgula decimal e duas casas nos valores monetários.

Os ajustes da T.A Atual ficam no localStorage do navegador e podem ser restaurados ou exportados em CSV. As abas do 5º T.A aguardam os dados de incremento; na base R$ HUGOL, UTI, PS e Cirurgias utilizarão os valores atualmente previstos no HUGOL. A nova aba com base R$ HUGO está preparada separadamente. Validar os dados com a planilha original antes de decisões financeiras.
