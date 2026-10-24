# Conferência do Reequilíbrio · Jan/25 - Dez/25

Fonte: `08 Matriz de Custeio HUGO - 4 T.A. Produção e Custos atualizados - janeiro a dezembro 2025 (redução de leitos) (5).xlsx`. A versão escolhida pelo usuário é **HUGO - ATUAL (PS 75%)**. Somente essa aba é importada; a versão PS R$ 1175,34 e Azul não compõem este cenário. O SHA-256, células de preços, fórmulas e seleção de cor ficam registrados em `rebalance-source.js`, protegido pelo acesso por senha.

| Categoria | Planilha e dashboard — mensal |
| --- | ---: |
| Enfermarias | R$ 7.818.281,72 |
| UTI | R$ 4.855.126,01 |
| Emergência | R$ 1.662.415,50 |
| Hospital dia | R$ 198.797,04 |
| Atendimento ambulatorial | R$ 615.551,48 |
| Cirurgias | R$ 5.002.906,66 |
| SADT interno | R$ 3.769.919,45 |
| SADT externo | R$ 173.749,65 |
| Escritório de gestão de altas | R$ 25.767,05 |
| **Total (P70)** | **R$ 24.122.514,56** |

O anual projeta doze meses iguais: **R$ 289.470.174,72**. As 41 linhas fecham em centavos com os custos armazenados na planilha. São 40 linhas inicialmente ativas; Ecodoppler interno (linha 44) tem quantidade zero, custo R$ 0,00 e permanece disponível para ativação e edição.

## Preços e produção

Os cabeçalhos K, L e M são P25, P50 e P75. As fórmulas P usam `ROUND(J × preço;2)` e indicam **34 linhas P50 e 7 P75**. Há 38 seleções verdes; em Ecodoppler interno (44), Ecodoppler externo (61) e gestão de altas (68), todas as opções têm preenchimento rosa uniforme. Nessas três linhas, o preço P50 é selecionado pela referência explícita da fórmula. Nenhum percentil é inferido a partir da cor rosa, e nenhuma fórmula arbitrária é executada.

O Pronto Atendimento é `P21 = ROUND(J21*M21;2)`: **2.770 × R$ 600,15 = R$ 1.662.415,50**, em P75. O preço R$ 1.175,34 pertence à outra aba e não é usado. PS Observação é outra linha: 18 leitos, ocupação de 99%, 542 pacientes-dia × R$ 798,74 em P50 = R$ 432.917,08.

Leitos/cirurgias vêm de H, ocupação/horas médias de I e produção de J. O paciente-dia segue `ROUND(leitos × ocupação × 30,4;0)` e as horas cirúrgicas também são arredondadas ao inteiro. Demais cirurgias usam 856 procedimentos × 2,2 horas, com 1.883 horas faturadas. Todos os volumes J são reproduzidos.

## Capacidade e ajustes

- Enfermarias: 70 + 107 + 105 + 6 + 18 = **306 leitos**, incluindo PS Observação.
- UTI: 10 + 20 + 20 + 10 = **60 leitos**, sem UTI Adulto 5.
- Total: **366 leitos**. A redução de 40 leitos em relação à base de produção Ago/25 - Jul/26 decorre das quantidades desta fonte.
- Enfermarias a 80%: R$ 7.506.103,98 no bloco e **R$ 23.810.336,82** no cenário.
- UTI a 80%: R$ 4.647.914,46 no bloco e **R$ 23.915.303,01** no cenário.

Aplicar ocupação ao bloco altera somente suas linhas ativas, em passos de 0,5, mantendo preços, quantidades, o outro bloco e linhas retiradas. Ajustes manuais são salvos em `novo-hugo-rebalance-v1`; as outras cinco bases mantêm seus próprios estados. O comparativo inclui os seis cenários atuais e permite usar Reequilíbrio como referência mensal ou anual. A diferença inicial em relação à produção Ago/25 - Jul/26 é **−R$ 2.495.766,81/mês**.

## Navegação

No computador, os acessos são agrupados em Aditivo em trâmite, 5º T.A HUGO, Reequilíbrio e Análise, com rótulos curtos e período visível. Em telas de até 1.100 px, o seletor mantém esses grupos. A base ativa fica no endereço (`#hugo-rebalance`) e é restaurada ao atualizar a página. As abas aceitam setas, Home e End; o atalho aos serviços aponta para a base ativa. Os títulos completos permanecem nos painéis e nos nomes acessíveis das abas.
