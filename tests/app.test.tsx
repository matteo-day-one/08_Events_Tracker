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

  it("generates a structured add proposal from the contribution form", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Propose add" }));

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
  });
});
