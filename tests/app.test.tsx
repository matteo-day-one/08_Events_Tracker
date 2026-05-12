import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("event tracker app", () => {
  it("renders the event directory and filters events by text", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Public Event Tracker" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Clean Energy Summit/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search events"), {
      target: { value: "medical" }
    });

    expect(screen.queryByRole("row", { name: /Clean Energy Summit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeInTheDocument();
  });

  it("opens add proposals in a drawer and returns focus when closed", () => {
    render(<App />);

    const addButton = screen.getByRole("button", { name: "Add event" });
    fireEvent.click(addButton);

    expect(screen.getByRole("dialog", { name: "Add event proposal" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Event name"), {
      target: { value: "Battery Research Demo Day" }
    });
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "https://example.org/battery-demo-day" }
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Bologna, Italy" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Demo day for battery research prototypes and industrial pilots." }
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-11-05" }
    });
    fireEvent.change(screen.getByLabelText("Application deadline"), {
      target: { value: "2026-10-10" }
    });
    fireEvent.change(screen.getByLabelText("Macrotopics"), {
      target: { value: "energy" }
    });
    fireEvent.change(screen.getByLabelText("Subtopics"), {
      target: { value: "batteries" }
    });
    fireEvent.change(screen.getByLabelText("Reason for proposal"), {
      target: { value: "Relevant public event for the energy community." }
    });

    const output = within(screen.getByTestId("proposal-output")).getByRole("textbox");
    const outputValue = (output as HTMLTextAreaElement).value;

    expect(outputValue).toContain("Action: add");
    expect(outputValue).toContain("2026-battery-research-demo-day");
    expect(outputValue).toContain('"macrotopics": [');

    fireEvent.click(screen.getByRole("button", { name: "Close proposal drawer" }));

    expect(screen.queryByRole("dialog", { name: "Add event proposal" })).not.toBeInTheDocument();
    expect(addButton).toHaveFocus();
  });

  it("opens update and delete proposal drawers from the selected event details", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Clean Energy Summit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Update event" }));

    expect(screen.getByRole("dialog", { name: "Update event proposal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target event")).toHaveValue("2026-clean-energy-summit");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Update event proposal" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update event" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));

    expect(screen.getByRole("dialog", { name: "Delete event proposal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target event")).toHaveValue("2026-clean-energy-summit");
  });
});
