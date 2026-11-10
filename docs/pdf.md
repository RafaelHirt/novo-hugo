# PDF com seleção de informações

O botão **Gerar PDF** fica ao lado de **Exportar CSV** nas abas de cenários. A seleção do relatório é independente da simulação e não altera os dados salvos.

1. Ajuste o cenário normalmente e clique em **Gerar PDF**.
2. Marque os cartões que deseja incluir: total mensal, mapa de leitos, variação e base de referência. Variação e base de referência começam desmarcadas. A identificação da opção Atual/Novo também pode ser omitida.
3. Escolha as colunas: quantidade/leitos, ocupação/horas médias, produção, custo unitário, referência do custo e total mensal por serviço.
4. Marque categorias inteiras ou serviços individuais. Os serviços ativos começam selecionados. A busca filtra a lista e preserva a seleção existente; as caixas de categoria afetam os serviços exibidos daquela categoria.
5. Clique em **Gerar PDF** e escolha **Salvar como PDF** na janela de impressão do navegador. Desmarque **Cabeçalhos e rodapés** para ocultar o endereço, o título e a data acrescentados pelo próprio navegador.

O relatório usa folhas A4 em paisagem com margens, cabeçalho e numeração próprios. O layout é medido antes da impressão: categorias menores, como Enfermarias e UTI, ficam juntas quando cabem em uma página. Categorias longas, como SADT, podem continuar em outra folha, repetindo o nome da categoria, os títulos das colunas e a indicação **Continuação**. Cada linha é mantida inteira; o total final acompanha as últimas linhas, em vez de aparecer sozinho em outra página. As tabelas têm linhas alternadas, colunas alinhadas e bordas completas.

O relatório usa os valores atuais da tela, os preços editados e seus percentis de origem, quando incluídos. O mapa usa os mesmos indicadores do dashboard, inclusive as deduções de 18 leitos aplicáveis. O cabeçalho opcional do navegador é controlado na janela de impressão; mesmo quando habilitado, o espaço interno do relatório preserva as tabelas e o rodapé próprio.

O cartão **Total mensal do cenário** representa o cenário completo. A tabela mostra somente as linhas selecionadas e identifica seu **Subtotal dos serviços selecionados**. Esse subtotal aparece apenas quando a coluna de total por serviço está incluída. É possível selecionar só os cartões, sem serviços, ou omitir todas as informações financeiras e mostrar somente serviços e quantidades.

Serviços desativados podem ser incluídos explicitamente; são identificados com custo considerado zero. Selecionar linhas para o PDF não ativa serviços nem seleciona incrementos no cenário.

## Validação

`tests/pdf.test.js` verifica dados editados, independência da simulação, mapa de leitos, subtotal em centavos, campos omitidos, resumo sem linhas, relatório sem valores em reais e tratamento de texto da fonte. Os módulos do PDF exigem autenticação, como os demais dados do dashboard.

O teste com Chromium gerou PDFs reais do cenário de R$ 28.178.607,12 reproduzido das capturas, de uma linha selecionada e de um resumo completo. A extração do texto confirmou a omissão de R$ 26.618.281,37 e da variação R$ 1.560.325,75 no PDF padrão, a inclusão explícita desses dados quando escolhidos e a preservação do cenário salvo. Também foram conferidos os controles em telas de 360 a 1440 pixels.

`node scripts/check-pdf-layout.mjs` verifica os limites das páginas e células, linhas ausentes ou duplicadas, UTI separada entre folhas, totais isolados e folhas extras. Requer o Chromium/Playwright e o Poppler já disponíveis no ambiente de desenvolvimento, sem adicionar dependências à aplicação. O teste cobre desktop, celular, cabeçalhos do navegador habilitados, todas as colunas, seleção parcial e uma categoria sintética de 125 linhas. O relatório de 42 serviços enviado pelo usuário passou de cinco para três páginas, preservando os valores e a seleção. O conjunto completo de 52 linhas com todas as colunas usa quatro páginas; a categoria sintética serve apenas como teste de paginação e é identificada como dados simulados.
