# Conferência da base HUGOL

Fonte: `01 NOVO HUGO alterado rafael.xlsx`. Importação restrita às sete abas solicitadas, usando os valores armazenados no arquivo. Os dados das abas HUGO - ATUAL, Azul e RESUMO não foram importados como cenários. A assinatura SHA-256 do arquivo consta em `hugol-source.js`.

| Cenário | Planilha e dashboard — mensal |
| --- | ---: |
| HUGO — Base HUGOL (sem aumento) | R$ 25.964.532,96 |
| Novo prédio — sem incrementos | R$ 26.074.748,34 |
| + Banco de sangue | R$ 26.255.187,84 |
| + Banco e ressonância | R$ 26.397.687,84 |
| + Banco, ressonância e SAD | R$ 26.631.081,84 |
| + Banco, ressonância, SAD e hemodinâmica | R$ 27.747.816,84 |
| + Todos e adequação de leitos | R$ 30.732.139,88 |

| Incremento independente | Composição | Acréscimo mensal |
| --- | --- | ---: |
| Banco de sangue | 750 bolsas de sangue total + 25 bolsas de plaquetas por aférese | R$ 180.439,50 |
| Ressonância magnética | 100 exames internos + 300 externos | R$ 142.500,00 |
| SAD | 120 atendimentos domiciliares | R$ 233.394,00 |
| Hemodinâmica | 250 procedimentos | R$ 1.116.735,00 |
| Adequação de leitos | +35 UI e +20 UTI; ajuste de 18 produções de SADT | R$ 2.984.323,04 |

Banco + SAD, sem ressonância e sem os demais incrementos: **R$ 26.488.581,84**. Ressonância + hemodinâmica, sem os demais: **R$ 27.333.983,34**. O motor verifica todos os 32 subconjuntos com soma em centavos.

## Divergência no subtotal das enfermarias

Nas seis abas de Novo Prédio, P12 contém `SUM(P6:P10)` e não inclui P11, a UI Clínica Cirúrgica Geral Adulto (2º Andar), com 40 leitos e R$ 1.308.864,45/mês. A soma de todas as linhas ultrapassa os totais publicados exatamente nesse valor.

Para cumprir o pedido de reproduzir os totais da planilha, essa exclusão está mantida e identificada no dashboard, no comparativo e no CSV. Os 40 leitos continuam nos indicadores porque I12 inclui essa linha. Não se confunde com PS Observação, que sempre fica fora da contagem de leitos.

Se for decidido incluir P11 no custeio, o novo prédio sem incrementos passa a **R$ 27.383.612,79**, e o cenário completo a **R$ 32.041.004,33**. O modelo testa também essa alternativa, mas a interface usa os totais originais da planilha.

## Regras de cálculo

- Novo prédio: pacientes-dia arredondados para cima, conforme `ROUNDUP(leitos × ocupação × 30,4; 0)` das abas importadas.
- Base sem aumento: pacientes-dia ao inteiro mais próximo, reproduzindo os valores armazenados.
- Cirurgias do novo prédio: quantidade × horas médias × valor/hora, preservando horas fracionadas.
- Serviços: quantidade × custo unitário; linhas financeiras somadas em centavos.
- Adequação: 336 UI + 70 UTI = 406 leitos passam a 371 UI + 90 UTI = 461. A base sem aumento permanece com 318 UI + 70 UTI = 388, excluído PS Observação.
- Ajustes manuais são locais à linha. A seleção do pacote de adequação aplica as alterações de SADT exatamente como na planilha; editar um leito manualmente não reestima outros serviços.

As alterações da base HUGOL são armazenadas separadamente da T.A Atual, e o comparativo usa o estado atual de ambas.
