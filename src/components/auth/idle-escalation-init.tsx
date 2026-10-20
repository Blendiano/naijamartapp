"use client";

import { useEffect } from "react";
import IdleEscalation from "idle-escalation";

const FIELD_SELECTOR = [
  "form input:not([type=hidden])",
  "form textarea",
  "form select",
  "input:not([type=hidden])",
  "textarea",
  "select",
].join(",");

export function IdleEscalationInit() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(FIELD_SELECTOR)
    );

    const instances = elements
      .filter((element) => element.dataset.ieInitialised !== "true")
      .map((element) => {
        element.dataset.ieInitialised = "true";
        return new IdleEscalation(element);
      });

    return () => {
      instances.forEach((instance) => instance.destroy());
      elements.forEach((element) => {
        delete element.dataset.ieInitialised;
      });
    };
  }, []);

  return null;
}
