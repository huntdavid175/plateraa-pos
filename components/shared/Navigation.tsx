"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/pos",
      label: "POS",
      icon: ShoppingCart,
    },
    {
      href: "/kitchen",
      label: "Kitchen",
      icon: ChefHat,
    },
  ];

  return (
    <nav className="flex items-center gap-2 border-r pr-4 mr-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors touch-manipulation",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

