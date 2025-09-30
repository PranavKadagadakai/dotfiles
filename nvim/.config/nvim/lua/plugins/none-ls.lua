return {
  "nvimtools/none-ls.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    local null_ls = require("null-ls")

    local sources = {
      null_ls.builtins.formatting.stylua,
      null_ls.builtins.formatting.prettier,
      null_ls.builtins.formatting.shellharden,
      null_ls.builtins.diagnostics.erb_lint,
      null_ls.builtins.diagnostics.rubocop,
      null_ls.builtins.formatting.rubocop,
    }

    -- Prefer eslint_d, fallback to eslint
    if vim.fn.executable("eslint_d") == 1 then
      table.insert(sources, null_ls.builtins.diagnostics.eslint_d)
      table.insert(sources, null_ls.builtins.formatting.eslint_d)
    elseif vim.fn.executable("eslint") == 1 then
      table.insert(sources, null_ls.builtins.diagnostics.eslint)
      table.insert(sources, null_ls.builtins.formatting.eslint)
    end

    null_ls.setup({
      sources = sources,
    })

    vim.keymap.set("n", "<leader>gf", vim.lsp.buf.format, {})
  end,
}

