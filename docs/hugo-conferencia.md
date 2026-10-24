# Conferência da base HUGO

Fonte: `02 NOVO HUGO - BASE HUGO VIGENTE (3).xlsx`. Importação dos valores armazenados nas seis abas de cenários, de HUGO - SEM BANCO DE SANGUE até HUGO - FINAL. HUGO - ATUAL, Azul e RESUMO não foram importados como cenários. A assinatura SHA-256 consta em `hugo-source.js`; o arquivo completo não é publicado.

| Aba de origem | Cenário | Planilha e dashboard — mensal |
| --- | --- | ---: |
| HUGO - SEM BANCO DE SANGUE | Novo Prédio - Base | R$ 28.665.201,56 |
| HUGO - SEM RESSONÂNCIA | + Banco de sangue | R$ 28.845.641,06 |
| HUGO - SEM SAD E HEMODINÂMICA | + Banco e ressonância | R$ 28.988.141,06 |
| HUGO - SEM HEMODINÂMICA | + Banco, ressonância e SAD | R$ 29.221.535,06 |
| HUGO - MENOS LEITOS | + Banco, ressonância, SAD e hemodinâmica | R$ 30.338.270,06 |
| HUGO - FINAL | + Todos e adequação de leitos | R$ 33.469.980,97 |

| Incremento independente | Composição | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total + 25 bolsas de plaquetas por aférese | R$ 180.439,50 |
| Ressonância magnética | 100 exames internos + 300 externos | R$ 142.500,00 |
| SAD | 120 atendimentos domiciliares | R$ 233.394,00 |
| Hemodinâmica | 250 procedimentos | R$ 1.116.735,00 |
| Adequação de leitos | +35 UI e +20 UTI; ajuste de 18 produções de SADT | R$ 3.131.710,91 |

Ressonância + hemodinâmica, sem banco e sem os demais incrementos: **R$ 29.924.436,56**. UI e UTI agora são opções separadas; os testes verificam as 64 combinações, todas as linhas dos seis cenários originais e a soma das categorias em centavos. A hemodinâmica oferece também 450 procedimentos por R$ 2.010.123,00 mensais.

## Adequações separadas

| Opção | Leitos acrescentados | Custo direto dos leitos | SADT isolado | Acréscimo isolado mensal |
| --- | ---: | ---: | ---: | ---: |
| Enfermaria (UI) | 35 | R$ 956.263,11 | R$ 258.568,26 | R$ 1.214.831,37 |
| UTI | 20 | R$ 1.771.384,23 | R$ 145.034,32 | R$ 1.916.418,55 |

Com ambas as adequações, o acréscimo é **R$ 3.131.710,91**, dos quais R$ 404.063,57 em SADT. Os efeitos isolados não são somados diretamente: o índice de SADT e as quantidades de cada linha têm arredondamentos. O cenário completo com 450 hemodinâmicas custa **R$ 34.363.368,97**.

## Regras preservadas

- Os pacientes-dia usam `ROUNDUP(leitos × ocupação × 30,4; 0)`, conforme as abas da fonte. Ocupação editável em passos de 0,5 ponto percentual.
- Cirurgias preservam horas fracionadas; serviços usam quantidade × custo unitário. Valores de cada linha são arredondados a centavos antes da soma.
- P12 desta revisão usa `SUM(P6:P11)` e inclui a UI Cirúrgica do 2º andar, R$ 1.094.156,85. O importador lê o intervalo real do subtotal; todas as seis UI participam do custeio e os totais coincidem com a fonte atualizada.
- A contagem inclui PS Observação na enfermaria: 336 enfermaria + 70 UTI = 406 leitos. Adequação apenas de UI: 371 + 70 = 441; apenas de UTI: 336 + 90 = 426; ambas: 371 + 90 = 461. O desconto anterior de 18 no indicador foi retirado; as quantidades financeiras e o custeio permanecem iguais.
- UI e UTI podem ser ampliadas separadamente. O SADT usa a fórmula da fonte, com índices 1,09 para +35 UI, 1,05 para +20 UTI e 1,14 para ambas; cada quantidade é arredondada. Com as duas opções, reproduz as linhas do cenário final. Alterar manualmente uma linha não reestima a produção das outras.
- A seleção ou retirada de um incremento restaura suas próprias linhas; preserva as demais edições manuais.
- 4 T.A (Atual), base HUGOL e base HUGO têm estados separados. O comparativo lê os valores, leitos e incrementos de cada estado, sem coluna de ocupação.

Os totais originais têm frações abaixo de um centavo em algumas células. A importação confere o total arredondado contra a soma das linhas monetárias em centavos; os seis totais coincidem.

## Percentis de referência

O arquivo complementar `02 NOVO HUGO - BASE HUGO VIGENTE CORRETA.xlsx` identifica o preço contratual escolhido na coluna O de HUGO - ATUAL, por referência direta à célula verde em K/L/M. Os serviços do novo prédio são associados pelo preço contratual e pela categoria; quando disponível, nome e categoria iguais têm preferência. A associação precisa resultar em um único percentil, e o preço M do novo prédio precisa coincidir com o preço já usado no dashboard. A anotação mantém todos os campos financeiros e os incrementos anteriores.

| Referência | Linhas no novo prédio |
| --- | ---: |
| P50 | 41 |
| P75 | 4 |
| Valor contratual sem P definido | 7 |

P75 corresponde às três UTI e à cirurgia eletiva de alto custo. P50 abrange as seis UI, as outras quatro modalidades cirúrgicas e os demais serviços com preço selecionado no contrato. Os valores contratuais sem P são Pronto Atendimento, SAD, duas ressonâncias, hemodinâmica, coleta de sangue total e plaquetas. O preço de Pronto Atendimento fica em `K22:M22`, uma célula mesclada, e não é tratado como P25.

As etiquetas de referência têm contraste e cor por percentil, com identificação textual; preços alterados são marcados como editados e mantêm a referência de origem. O CSV inclui a mesma indicação. `scripts/import-hugo-percentiles.py` registra nome e SHA-256 da fonte complementar, além das células de origem de cada referência.

## Ajustes e restauração do bloco

Cada bloco tem um único botão **Restaurar bloco**, substituindo as setas por linha. Ele remove todas as edições dos serviços daquela categoria, mesmo quando ocultos por busca, incluindo ativação, quantidades, preços e ocupações. Preserva outros blocos, base e incrementos selecionados. Se a adequação de UI estiver ativa, restaurar Enfermarias mantém os 35 leitos acrescentados pelo incremento e retorna às quantidades desse cenário.

Ocupações alteradas mostram **Antes → Atual** em cada linha, com a taxa original da referência e o valor ajustado. O campo do bloco mostra **Digitar %** quando as linhas têm taxas diferentes. O comportamento se aplica às seis bases financeiras e aos ajustes restaurados do navegador.
