import {
  BaseSource,
  DdcGatherItems,
} from "https://deno.land/x/ddc_vim@v4.0.0/types.ts";
import type {
  GatherArguments,
  GetCompletePositionArguments,
  OnCompleteDoneArguments,
} from "https://deno.land/x/ddc_vim@v4.0.0/base/source.ts";

type Params = Record<never, never>;

interface Position {
  line: number;
  character: number;
}

type UserData = {
  pos: Position;
  text: string;
};

const WS_REGEX = /^\s*$/;
export class Source extends BaseSource<Params, UserData> {
  // deno-lint-ignore require-await
  override async getCompletePosition(
    args: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    return args.context.input.length;
  }

  override async gather(
    args: GatherArguments<Params>,
  ): Promise<DdcGatherItems<UserData>> {
    await args.denops.call(
      "luaeval",
      "require'ddc_copilot'.fetch_completions()",
    );
    return [];
  }

  override async onCompleteDone(
    args: OnCompleteDoneArguments<Params, UserData>,
  ): Promise<void> {
    const oldText =
      (await args.denops.call("getline", args.userData.pos.line)) as string;
    const text = args.userData.text.split("\n");
    if (text.length <= 1) return;
    if (WS_REGEX.test(text[text.length - 1])) text.pop();

    const newText = oldText.slice(0, args.userData.pos.character) + text[0];

    // modify first line
    args.denops.call("setline", args.userData.pos.line + 1, newText);
    // then append rest lines
    await args.denops.call("append", args.userData.pos.line + 1, text.slice(1));
  }

  override params(): Params {
    return {};
  }
}
