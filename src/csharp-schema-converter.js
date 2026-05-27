(function registerCsharpSchemaConverter(globalScope) {
  const template = document.createElement("template");

  template.innerHTML = `
    <style>
      :host {
        display: block;
      }

      .converter {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 20px;
        align-items: stretch;
      }

      .pane {
        min-width: 0;
      }

      label,
      .output-label {
        display: block;
        margin: 0 0 8px;
        color: #354258;
        font-size: 0.92rem;
        font-weight: 680;
      }

      textarea,
      pre {
        box-sizing: border-box;
        width: 100%;
        min-height: 560px;
        margin: 0;
        border: 1px solid #c8d0dd;
        border-radius: 8px;
        background: #ffffff;
        color: #172033;
        font: 0.92rem/1.52 "Cascadia Code", "Fira Code", Consolas, monospace;
      }

      textarea {
        display: block;
        padding: 16px;
        resize: vertical;
      }

      textarea:focus {
        border-color: #2f6feb;
        box-shadow: 0 0 0 3px rgba(47, 111, 235, 0.15);
        outline: none;
      }

      .output-shell {
        position: relative;
      }

      pre {
        overflow: auto;
        padding: 48px 16px 16px;
        white-space: pre;
      }

      button {
        position: absolute;
        top: 10px;
        right: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        height: 34px;
        border: 1px solid #bac5d5;
        border-radius: 7px;
        background: #eef3fa;
        color: #1f2c3f;
        cursor: pointer;
      }

      button:hover {
        background: #e2eaf5;
      }

      button:focus-visible {
        outline: 3px solid rgba(47, 111, 235, 0.25);
        outline-offset: 2px;
      }

      svg {
        width: 17px;
        height: 17px;
      }

      @media (max-width: 860px) {
        .converter {
          grid-template-columns: 1fr;
        }

        textarea,
        pre {
          min-height: 420px;
        }
      }
    </style>

    <section class="converter">
      <div class="pane">
        <label for="source">C# Class</label>
        <textarea id="source" spellcheck="false"></textarea>
      </div>
      <div class="pane">
        <span class="output-label">JSON Schema</span>
        <div class="output-shell">
          <button type="button" title="Copy JSON Schema" aria-label="Copy JSON Schema">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
          <pre id="output">Paste a C# class to generate JSON Schema.</pre>
        </div>
      </div>
    </section>
  `;

  class CsharpJsonSchemaConverter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
    }
  }

  if (!globalScope.customElements.get("csharp-json-schema-converter")) {
    globalScope.customElements.define(
      "csharp-json-schema-converter",
      CsharpJsonSchemaConverter,
    );
  }
})(window);
