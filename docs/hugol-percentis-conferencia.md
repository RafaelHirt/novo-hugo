# Conferência dos percentis HUGOL

Registro técnico dos preços importados antes da correção confirmada pelo usuário. O modelo atual aplica R$ 4.948,21 à gestão de altas. As referências e etiquetas desta conferência não são exibidas na interface, no comparativo ou no CSV das bases HUGOL e HUGO.

Fonte das referências: Imagem corrigida de percentis HUGOL fornecida pelo usuário em 24/10/2026; substitui a imagem anterior. A seleção usa a coluna verde da imagem, identificada por serviço, nunca a igualdade isolada de preços. A fonte financeira continua sendo `01 NOVO HUGO - BASE HUGOL.xlsx`.

## Resultado

- Novo Prédio (52 linhas, incluindo os serviços dos incrementos): 46 custos unitários conferem, 1 diverge e 5 não têm referência na imagem.
- Base HUGOL sem aumento (42 linhas): 34 conferem, 1 diverge e 7 não têm referência na imagem.
- Gestão de altas: dashboard R$ 5.153,41; imagem P50 R$ 4.948,21. Diferença de R$ 205,20 por unidade, ou R$ 2.052,00/mês com 10 unidades no novo prédio; R$ 1.026,00/mês com 5 na base sem aumento.
- Nenhum preço, quantidade, seleção de incremento ou total financeiro foi alterado.

Os totais da imagem corrigida (R$ 36.664.844,00 antes e R$ 36.756.107,44 depois da A.T. HECAD) usam outros serviços e quantitativos. A conferência abaixo é de custos unitários, não dos totais desses hospitais. A imagem anterior foi descartada como referência.

## Correspondência entre os serviços

As UI médicas e cirúrgicas gerais são conferidas com os itens 1.1.1 e 1.1.2; as UTI adultas com 1.2.1. Cirurgias de alto custo usam 3.4/P75; alto giro usa 3.1/P50, média e alta complexidade do HUGO usam 3.2/P50, e demais cirurgias usam 3.5/P50. O item 3.3/P75 da imagem é específico de cirurgias cardíacas neonatais e pediátricas, sem linha própria no cenário HUGO. Consulta Não Médica corresponde à Consulta Multiprofissional. Colonoscopia e Endoscopia usam o item agrupado 5.8; a Broncoscopia isolada usa 5.4, cujo preço é diferente.

Quando a linha externa reutiliza um custo interno por fórmula explícita da planilha, a tabela registra esse vínculo. Ecodoppler não é tratado como Ecocardiograma. Semelhança de preço não permite atribuir percentil à UI de população privada de liberdade nem ao PS Observação, ausentes na imagem. P50 no banco de sangue e plaquetas vem do verde da imagem, mesmo quando os três preços são iguais.

A tabela registra as correspondências da importação original com a imagem e mantém os serviços ausentes sem percentil. A correção de preço posterior é aplicada no modelo, separada deste registro da fonte.

## Base HUGOL sem aumento

| Grupo / serviço | Célula do preço | Dashboard | P verde / imagem | Item da imagem / vínculo de preço | Conferência |
| --- | --- | ---: | --- | --- | --- |
| Enfermarias · UI Clínica Médica (2º Andar) | H6 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.1 | Confere |
| Enfermarias · UI Clínica Cirúrgica (3º Andar) | H7 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| Enfermarias · UI Clínica Cirúrgica (4º andar) | H8 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| Enfermarias · UI Pop. Privad. Liberd. (4º andar) | H9 | R$ 1.195,31 | — | — | Sem referência na imagem |
| Enfermarias · PS Observação | H10 | R$ 1.068,22 | — | — | Sem referência na imagem |
| UTI · UTI Adulto 1 | H13 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto 2 | H14 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto 3 | H15 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto 4 | H16 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto 5 | H17 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| Emergência · Pronto Atendimento | H22 | R$ 553,01 | P75 · R$ 553,01 | 2.1 | Confere |
| Hospital dia · Leito-dia | H25 | R$ 308,00 | — | — | Sem referência na imagem |
| Atendimento ambulatorial · Consulta Médica | H28 | R$ 141,34 | P50 · R$ 141,34 | 4.1 | Confere |
| Atendimento ambulatorial · Consulta Não Médica | H29 | R$ 79,36 | P50 · R$ 79,36 | 4.2 | Confere |
| Atendimento ambulatorial · Procedimentos ambulatoriais | H30 | R$ 202,74 | P50 · R$ 202,74 | 4.3 | Confere |
| Cirurgias · Cirurgias alto custo | H34 | R$ 2.728,19 | P75 · R$ 2.728,19 | 3.4 | Confere |
| Cirurgias · Demais cirurgias | H35 | R$ 2.062,11 | P50 · R$ 2.062,11 | 3.5 | Confere |
| SADT interno · Agência transfusional | H39 | R$ 392,36 | P50 · R$ 392,36 | 5.1 | Confere |
| SADT interno · Anatomia patológica | H40 | R$ 104,63 | P50 · R$ 104,63 | 5.2 | Confere |
| SADT interno · Análises clínicas | H41 | R$ 9,55 | P50 · R$ 9,55 | 5.3 | Confere |
| SADT interno · Broncoscopia | H42 | R$ 3.082,12 | P50 · R$ 3.082,12 | 5.4 | Confere |
| SADT interno · Colonoscopia | H43 | R$ 624,37 | P50 · R$ 624,37 | 5.8 | Confere |
| SADT interno · Ecocardiograma | H44 | R$ 185,36 | P50 · R$ 185,36 | 5.6 e 7.2 | Confere |
| SADT interno · Ecodoppler | H45 | R$ 203,58 | — | — | Sem referência na imagem |
| SADT interno · Eletrocardiograma | H46 | R$ 30,83 | P50 · R$ 30,83 | 5.7 | Confere |
| SADT interno · Eletroencefalograma | H47 | R$ 355,62 | — | — | Sem referência na imagem |
| SADT interno · Endoscopia | H48 | R$ 624,37 | P50 · R$ 624,37 | 5.8 | Confere |
| SADT interno · Raio X | H49 | R$ 68,23 | P50 · R$ 68,23 | 5.10 | Confere |
| SADT interno · Tomografia Computadorizada | H50 | R$ 168,50 | P50 · R$ 168,50 | 5.13 e 7.7 | Confere |
| SADT interno · Ultrassonografia | H51 | R$ 105,85 | P50 · R$ 105,85 | 5.14 | Confere |
| SADT interno · Fisioterapia | H52 | R$ 31,87 | P50 · R$ 31,87 | 5.15 | Confere |
| SADT interno · Fonoaudiologia | H53 | R$ 49,68 | P50 · R$ 49,68 | 5.16 | Confere |
| SADT interno · Hemodiálise | H54 | R$ 590,29 | P50 · R$ 590,29 | 5.17 | Confere |
| SADT interno · Psicologia | H55 | R$ 46,32 | P50 · R$ 46,32 | 5.18 | Confere |
| SADT interno · Terapia ocupacional | H56 | R$ 87,02 | P50 · R$ 87,02 | 5.19 | Confere |
| SADT interno · Odontologia Hospitalar | H57 | R$ 112,09 | — | — | Sem referência na imagem |
| SADT externo · Colonoscopia | H61 | R$ 624,37 | P50 · R$ 624,37 | 5.8; `H61=H43` | Confere |
| SADT externo · Ecodoppler | H62 | R$ 203,58 | — | — | Sem referência na imagem |
| SADT externo · Endoscopia | H63 | R$ 624,37 | P50 · R$ 624,37 | 5.8; `H63=H48` | Confere |
| SADT externo · Tomografia Computadorizada | H64 | R$ 168,50 | P50 · R$ 168,50 | 5.13 e 7.7; `H64=H50` | Confere |
| SADT externo · Ultrassonografia | H65 | R$ 105,85 | P50 · R$ 105,85 | 5.14; `H65=H51` | Confere |
| Escritório de gestão de altas · Escritório de gestão de altas | H69 | R$ 5.153,41 | P50 · R$ 4.948,21 | 10.1 | Divergente |

## Novo Prédio

| Grupo / serviço | Célula do preço | Dashboard | P verde / imagem | Item da imagem / vínculo de preço | Conferência |
| --- | --- | ---: | --- | --- | --- |
| Enfermarias · UI Clínica Médica Adulto (6º Andar) | M6 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.1 | Confere |
| Enfermarias · UI Clínica Médica Adulto (5º Andar) | M7 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.1 | Confere |
| Enfermarias · UI Clínica Cirúrgica Geral Adulto (5º Andar) | M8 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| Enfermarias · UI Clínica Cirúrgica Geral Adulto (4º Andar) | M9 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| Enfermarias · UI Clínica Cirúrgica Geral Adulto (3º Andar) | M10 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| Enfermarias · UI Clínica Cirúrgica Geral Adulto (2º Andar) | M11 | R$ 1.195,31 | P75 · R$ 1.195,31 | 1.1.2 | Confere |
| UTI · UTI Adulto (Pavimento Superior) | M16 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto (1º Andar) | M17 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| UTI · UTI Adulto (3º Andar) | M18 | R$ 2.494,05 | P50 · R$ 2.494,05 | 1.2.1 | Confere |
| Emergência · Pronto Atendimento Geral | M23 | R$ 553,01 | P75 · R$ 553,01 | 2.1 | Confere |
| Serviço de desospitalização · Serviço de atendimento docimiliar | M26 | R$ 1.944,95 | P50 · R$ 1.944,95 | 8.1 | Confere |
| Hospital dia · Leito dia | M29 | R$ 308,00 | — | — | Sem referência na imagem |
| Atendimento ambulatorial · Consulta Médica | M32 | R$ 141,34 | P50 · R$ 141,34 | 4.1 | Confere |
| Atendimento ambulatorial · Consulta Não Médica | M33 | R$ 79,36 | P50 · R$ 79,36 | 4.2 | Confere |
| Atendimento ambulatorial · Procedimentos ambulatoriais | M34 | R$ 202,74 | P50 · R$ 202,74 | 4.3 | Confere |
| Cirurgias · Cirurgias eletivas de alto giro | M38 | R$ 2.062,11 | P50 · R$ 2.062,11 | 3.1 | Confere |
| Cirurgias · Cirurgias eletivas de média complexidade | M39 | R$ 2.062,11 | P50 · R$ 2.062,11 | 3.2 | Confere |
| Cirurgias · Cirurgias eletivas de alta complexidade | M40 | R$ 2.062,11 | P50 · R$ 2.062,11 | 3.2 | Confere |
| Cirurgias · Cirurgias eletivas de alto custo | M41 | R$ 2.728,19 | P75 · R$ 2.728,19 | 3.4 | Confere |
| Cirurgias · Demais cirurgias de urgências | M42 | R$ 2.062,11 | P50 · R$ 2.062,11 | 3.5 | Confere |
| SADT interno · Agência transfusional | M46 | R$ 392,36 | P50 · R$ 392,36 | 5.1 | Confere |
| SADT interno · Anatomia patológica | M47 | R$ 104,63 | P50 · R$ 104,63 | 5.2 | Confere |
| SADT interno · Análises clínicas | M48 | R$ 9,55 | P50 · R$ 9,55 | 5.3 | Confere |
| SADT interno · Broncoscopia | M49 | R$ 3.082,12 | P50 · R$ 3.082,12 | 5.4 | Confere |
| SADT interno · Colonoscopia | M50 | R$ 624,37 | P50 · R$ 624,37 | 5.8 | Confere |
| SADT interno · Ecodoppler | M51 | R$ 203,58 | — | — | Sem referência na imagem |
| SADT interno · Ecocardiograma | M52 | R$ 185,36 | P50 · R$ 185,36 | 5.6 e 7.2 | Confere |
| SADT interno · Eletrocardiograma | M53 | R$ 30,83 | P50 · R$ 30,83 | 5.7 | Confere |
| SADT interno · Eletroencefalograma | M54 | R$ 355,62 | — | — | Sem referência na imagem |
| SADT interno · Endoscopia | M55 | R$ 624,37 | P50 · R$ 624,37 | 5.8 | Confere |
| SADT interno · Raio X | M56 | R$ 68,23 | P50 · R$ 68,23 | 5.10 | Confere |
| SADT interno · Ressonância Magnética | M57 | R$ 356,25 | P50 · R$ 356,25 | 5.11 e 7.5 | Confere |
| SADT interno · Tomografia Computadorizada | M58 | R$ 168,50 | P50 · R$ 168,50 | 5.13 e 7.7 | Confere |
| SADT interno · Ultrassonografia | M59 | R$ 105,85 | P50 · R$ 105,85 | 5.14 | Confere |
| SADT interno · Fisioterapia | M60 | R$ 31,87 | P50 · R$ 31,87 | 5.15 | Confere |
| SADT interno · Fonoaudiologia | M61 | R$ 49,68 | P50 · R$ 49,68 | 5.16 | Confere |
| SADT interno · Hemodiálise | M62 | R$ 590,29 | P50 · R$ 590,29 | 5.17 | Confere |
| SADT interno · Psicologia | M63 | R$ 46,32 | P50 · R$ 46,32 | 5.18 | Confere |
| SADT interno · Terapia ocupacional | M64 | R$ 87,02 | P50 · R$ 87,02 | 5.19 | Confere |
| SADT interno · Odontologia Hospitalar | M65 | R$ 112,09 | — | — | Sem referência na imagem |
| SADT externo · Colonoscopia | M69 | R$ 624,37 | P50 · R$ 624,37 | 5.8; `M69=M50` | Confere |
| SADT externo · Ecocardiograma | M70 | R$ 185,36 | P50 · R$ 185,36 | 5.6 e 7.2; `M70=M52` | Confere |
| SADT externo · Ecodoppler | M71 | R$ 203,58 | — | — | Sem referência na imagem |
| SADT externo · Endoscopia | M72 | R$ 624,37 | P50 · R$ 624,37 | 5.8; `M72=M55` | Confere |
| SADT externo · Raio X | M73 | R$ 68,23 | P50 · R$ 68,23 | 5.10; `M73=M56` | Confere |
| SADT externo · Ressonância Magnética | M74 | R$ 356,25 | P50 · R$ 356,25 | 5.11 e 7.5; `M74=M57` | Confere |
| SADT externo · Tomografia Computadorizada | M75 | R$ 168,50 | P50 · R$ 168,50 | 5.13 e 7.7; `M75=M58` | Confere |
| SADT externo · Ultrassonografia | M76 | R$ 105,85 | P50 · R$ 105,85 | 5.14; `M76=M59` | Confere |
| Hemodinâmica · Procedimento de hemodinâmica | M80 | R$ 4.466,94 | P75 · R$ 4.466,94 | 6.1 | Confere |
| Hemoterapia · Bolsas de sangue total coletadas | M83 | R$ 194,93 | P50 · R$ 194,93 | 9.1 (antes e depois da A.T. HECAD) | Confere |
| Hemoterapia · Bolsas de plaquetas por aférese produzidas | M84 | R$ 1.369,68 | P50 · R$ 1.369,68 | 9.2 (antes e depois da A.T. HECAD) | Confere |
| Escritório de gestão de altas · Escritório de gestão de altas | M87 | R$ 5.153,41 | P50 · R$ 4.948,21 | 10.1 | Divergente |
