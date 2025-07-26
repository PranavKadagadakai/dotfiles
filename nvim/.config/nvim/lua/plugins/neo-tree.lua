return {
	"nvim-neo-tree/neo-tree.nvim",
	branch = "v3.x",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
		"MunifTanjim/nui.nvim",
	},
	config = function()
		vim.keymap.set("n", "<C-n>", ":Neotree filesystem reveal right<CR>", {})
		vim.keymap.set("n", "<leader>bf", ":Neotree buffers reveal float<CR>", {})

    -- Neo-tree setup with hidden files shown
    require("neo-tree").setup({
      filesystem = {
        filtered_items = {
          visible = true,      -- Show hidden files (dotfiles)
          hide_dotfiles = false,
        },
      },
    })
	end,
}
