"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { ButtonGhost } from "@/shared/components/ui/Buttons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

type Court = {
  id: string;
  name: string;
};

interface CourtSelectorProps {
  courts: Court[];
  selectedCourtIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CourtSelector({
  courts,
  selectedCourtIds,
  onSelectionChange,
}: CourtSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (courtId: string) => {
    const newSelection = selectedCourtIds.includes(courtId)
      ? selectedCourtIds.filter((id) => id !== courtId)
      : [...selectedCourtIds, courtId];
    onSelectionChange(newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ButtonGhost
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedCourtIds.length > 0
            ? `${selectedCourtIds.length} cancha(s) seleccionada(s)`
            : "Todas las canchas"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </ButtonGhost>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar cancha..." />
          <CommandList>
            <CommandEmpty>No se encontraron canchas.</CommandEmpty>
            <CommandGroup>
              {courts.map((court) => (
                <CommandItem
                  key={court.id}
                  value={court.name}
                  onSelect={() => handleSelect(court.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCourtIds.includes(court.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {court.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
