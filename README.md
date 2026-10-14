# Novo HUGO · Simulador de custeio

Dashboard estático em português para simulação financeira. Paleta verde, amarelo e branco inspirada nas cores de Goiás; não utiliza logotipo oficial.

## Desenvolvimento

Node.js 20 ou superior. Sem dependências externas de execução.

```sh
npm run dev
npm test
npm run build
```

Servidor na porta 3000 (ou `PORT`). Build em `dist`. No Netlify, conecte este repositório: `netlify.toml` configura build e diretório de publicação. Nenhum segredo é necessário.

## Dados e cálculos

`data.js` transcreve os dados da imagem HOSPITAL: HUGO — 4º TA ao TC 97/2024. Referência mensal: R$ 27.261.236,24. Custos unitários extraídos do 1º Termo Aditivo ao TC 97/2024.

Os totais de linha da imagem são preservados como base, pois quantidades e custos unitários exibidos podem conter arredondamentos. Fórmula: total original × quantidade atual / original × custo unitário atual / original; internação também multiplica ocupação atual / original e cirurgia multiplica horas médias atuais / originais. A ocupação é percentual de 0 a 100. Os 406 leitos incluem somente enfermarias e UTI. Valores são mensais; o anual é uma projeção de 12 meses iguais. Não é uma proposta contratual e não incorpora inflação ou modelagem de custos fixos.

Os ajustes ficam no localStorage do navegador e podem ser restaurados ou exportados em CSV. A aba HUGOL aguarda dados; UTI, PS e Cirurgias utilizarão os valores atualmente previstos no HUGOL. Validar os dados com a planilha original antes de decisões financeiras.
