local api = require"copilot.api"
local util = require"copilot.util"
local mod = {}

local find_buf_client = function()
  for _, client in ipairs(vim.lsp.get_clients()) do
    if client.name == "copilot" then return client end
  end
end

local function fl(str)
  local p, _ = string.find(str, '\n')
  if p == nil then return str end
  return string.sub(str, 1, p - 1)
end

mod.fetch_completions = function()
  local client = find_buf_client()
  if client == nil then return end

  local a = util.get_doc_params()
  api.get_completions_cycling(client, a, function(err, result, _)
    if err or not result or not result.completions then
      -- print("err", vim.inspect(err))
      return
    end

    local res = {}
    for i, c in ipairs(result.completions) do
      res[i] = {
        word = fl(c.displayText),
        info = c.text,
        user_data = {
          text = c.text,
          pos = c.range.start,
        }
      }
    end
    vim.fn['ddc#update_items']('copilot', res)

  end)
end

return mod
