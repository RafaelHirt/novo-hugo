# PDF com seleção de informações

O botão **Gerar PDF** fica ao lado de **Exportar CSV** nas abas de cenários. A seleção do relatório é independente da simulação e não altera os dados salvos.

1. Ajuste o cenário normalmente e clique em **Gerar PDF**.
2. Marque os cartões que deseja incluir: total mensal, mapa de leitos, variação e base de referência. Variação e base de referência começam desmarcadas. A identificação da opção Atual/Novo também pode ser omitida.
3. Escolha as colunas: quantidade/leitos, ocupação/horas médias, produção, custo unitário, referência do custo e total mensal por serviço.
4. Marque categorias inteiras ou serviços individuais. Os serviços ativos começam selecionados. A busca filtra a lista e preserva a seleção existente; as caixas de categoria afetam os serviços exibidos daquela categoria.
5. Clique em **Gerar PDF** e escolha **Salvar como PDF** na janela de impressão do navegador.

O relatório usa A4 em paisagem, repete os cabeçalhos das tabelas entre páginas e permite quebrar categorias longas sem cortar linhas. Usa os valores atuais da tela, os preços editados e seus percentis de origem, quando incluídos. O mapa usa os mesmos indicadores do dashboard, inclusive as deduções de 18 leitos aplicáveis.

O cartão **Total mensal do cenário** representa o cenário completo. A tabela mostra somente as linhas selecionadas e identifica seu **Subtotal dos serviços selecionados**. Esse subtotal aparece apenas quando a coluna de total por serviço está incluída. É possível selecionar só os cartões, sem serviços, ou omitir todas as informações financeiras e mostrar somente serviços e quantidades.

Serviços desativados podem ser incluídos explicitamente; são identificados com custo considerado zero. Selecionar linhas para o PDF não ativa serviços nem seleciona incrementos no cenário.

## Validação

`tests/pdf.test.js` verifica dados editados, independência da simulação, mapa de leitos, subtotal em centavos, campos omitidos, resumo sem linhas, relatório sem valores em reais e tratamento de texto da fonte. Os módulos do PDF exigem autenticação, como os demais dados do dashboard.

O teste com Chromium gerou PDFs reais do cenário de R$ 28.178.607,12 reproduzido das capturas, de uma linha selecionada e de um resumo completo. A extração do texto confirmou a omissão de R$ 26.618.281,37 e da variação R$ 1.560.325,75 no PDF padrão, a inclusão explícita desses dados quando escolhidos e a preservação do cenário salvo. Também foram conferidos os controles em telas de 360 a 1440 pixels.
