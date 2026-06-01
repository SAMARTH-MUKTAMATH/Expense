"use client";

import Link from "next/link";
import { Menu, Users } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LayoutGridIcon } from "@/components/ui/layout-grid";
import { SparklesIcon } from "@/components/ui/sparkles";

export function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Menu"
          className="bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
        >
          <Menu size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-[#161616] border-white/10 text-white"
      >
        <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutGridIcon size={16} />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
          <Link href="/groups" className="flex items-center gap-2">
            <Users size={16} />
            Splitwise
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
          <Link href="/advisor" className="flex items-center gap-2">
            <SparklesIcon size={16} />
            Financial Advice
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
