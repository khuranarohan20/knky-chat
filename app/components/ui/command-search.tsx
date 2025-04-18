import { useState } from "react";
import { cn } from "~/lib/utils";
import { Command, CommandInput, CommandItem, CommandList } from "./command";

interface ICommandProps {
  commands: { value: string; label: string }[];
  topClassNames?: string;
  inputClassNames?: string;
  listClassNames?: string;
  listItemClassNames?: string;
}

export default function CommandSearch(props: ICommandProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleValueChange = (value: string) => {
    setInputValue(value);
    setOpen(!!value);
  };

  const filteredCommands = Array.isArray(props.commands)
    ? props.commands.filter((command) =>
        command.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  return (
    <Command className={cn(props.topClassNames, "rounded-lg border shadow-md")}>
      <CommandInput
        placeholder="Type a command or search..."
        onValueChange={handleValueChange}
        className={cn(props.inputClassNames)}
      />
      {
        <CommandList className={cn(props.listClassNames)}>
          {open &&
            filteredCommands.length > 0 &&
            filteredCommands.map((command) => (
              <CommandItem
                key={command.value}
                value={command.value}
                className={cn(props.listItemClassNames)}
              >
                {command.label}
              </CommandItem>
            ))}
        </CommandList>
      }
    </Command>
  );
}
