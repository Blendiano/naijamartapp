"use client";

import { ChevronDown, HelpCircle, MessageCircle, MessagesSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownNavItem } from "@/components/layout/dropdown-nav-item";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { HELP_TOPICS } from "@/lib/help-topics";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
const liveChatUrl = process.env.NEXT_PUBLIC_LIVE_CHAT_URL;

export function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Open help menu"
            className="group inline-flex items-center gap-2 h-9 px-2 sm:px-3.5 rounded-md text-sm font-medium text-secondary transition-colors hover:bg-surface-container-highest hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-surface-container-highest data-[popup-open]:text-primary"
          >
            <HelpCircle className="h-5 w-5 transition-colors group-hover:text-primary" aria-hidden="true" />
            <span className="hidden lg:inline">Help</span>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-200 group-data-[popup-open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 max-h-[70vh]">
        <DropdownMenuGroup>
          {HELP_TOPICS.map((topic) => (
            <DropdownNavItem
              key={topic.id}
              href={`/help#${topic.id}`}
              icon={<topic.icon className="h-4 w-4" aria-hidden="true" />}
            >
              {topic.label}
            </DropdownNavItem>
          ))}
        </DropdownMenuGroup>

        {(liveChatUrl || whatsappNumber) && (
          <>
            <DropdownMenuSeparator className="mx-0 my-1" />

            <div className="p-1 flex flex-col gap-1.5">
              {liveChatUrl && (
                <DropdownMenuItem
                  render={
                    <a
                      href={liveChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ size: "sm", className: "w-full" }),
                        "hover:bg-primary/90! hover:text-primary-foreground! focus-visible:bg-primary/90! focus-visible:text-primary-foreground!"
                      )}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Live chat
                    </a>
                  }
                />
              )}

              {whatsappNumber && (
                <DropdownMenuItem
                  render={
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm", className: "w-full" }),
                        "hover:border-primary! hover:text-primary! focus-visible:border-primary! focus-visible:text-primary!"
                      )}
                    >
                      <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                  }
                />
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
