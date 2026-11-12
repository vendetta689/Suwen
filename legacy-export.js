    function syncFormValuesForExport(root) {
      root.querySelectorAll("input").forEach(input => input.setAttribute("value", input.value));
      root.querySelectorAll("select").forEach(select => {
        [...select.options].forEach(option => {
          if (option.value === select.value) option.setAttribute("selected", "selected");
          else option.removeAttribute("selected");
        });
      });
    }

    function collectPageStyles() {
      return [...document.styleSheets].map(sheet => {
        try {
          return [...sheet.cssRules].map(rule => rule.cssText).join("\n");
        } catch {
          return "";
        }
      }).join("\n");
    }

    async function exportScreenshot() {
      render();
      const button = document.getElementById("exportScreenshotBtn");
      const originalText = button.textContent;
      button.textContent = "Exporting...";
      button.disabled = true;
      try {
        const width = 1500;
        const padding = 32;
        const gap = 24;
        const leftWidth = 420;
        const rightWidth = width - padding * 2 - gap - leftWidth;
        const maxHeight = 24000;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = maxHeight;
        const ctx = canvas.getContext("2d");
        const getText = el => (el?.textContent || "").replace(/\s+/g, " ").trim();
        const drawText = (value, x, y, maxWidth, options = {}) => {
          const fontSize = options.fontSize || 14;
          const lineHeight = options.lineHeight || Math.round(fontSize * 1.55);
          ctx.font = `${options.weight || 400} ${fontSize}px "Microsoft YaHei", Arial, sans-serif`;
          ctx.fillStyle = options.color || "#1f2933";
          const content = String(value ?? "");
          const lines = [];
          let line = "";
          for (const char of content) {
            const next = line + char;
            if (ctx.measureText(next).width > maxWidth && line) {
              lines.push(line);
              line = char;
            } else {
              line = next;
            }
          }
          lines.push(line);
          lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
          return y + lines.length * lineHeight;
        };
        const card = (x, y, w, h) => {
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#d8dee8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 8);
          ctx.fill();
          ctx.stroke();
        };
        const outlineCard = (x, y, w, h) => {
          ctx.strokeStyle = "#d8dee8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 8);
          ctx.stroke();
        };
        const rowsFromTable = table => [...table.querySelectorAll("tr")].map(tr => [...tr.children].map(td => getText(td)));
        const drawTablePanel = (title, rows, x, y, w) => {
          const start = y;
          y += 18;
          y = drawText(title, x + 18, y, w - 36, { fontSize: 18, weight: 700, lineHeight: 24 }) + 8;
          const colCount = Math.max(...rows.map(row => row.length), 1);
          const colWidths = colCount === 3 ? [w * .34, w * .22, w * .36] : colCount === 4 ? [w * .24, w * .18, w * .22, w * .28] : Array.from({ length: colCount }, () => (w - 36) / colCount);
          rows.forEach((row, rowIndex) => {
            const rowStart = y;
            let rowHeight = 28;
            row.forEach((cell, index) => {
              ctx.font = `${rowIndex === 0 ? 700 : 400} 13px "Microsoft YaHei", Arial, sans-serif`;
              const lineCount = Math.max(1, Math.ceil(ctx.measureText(cell).width / Math.max(colWidths[index] - 10, 40)));
              rowHeight = Math.max(rowHeight, lineCount * 18 + 10);
            });
            ctx.fillStyle = rowIndex === 0 ? "#f8fafc" : "#ffffff";
            ctx.fillRect(x + 18, rowStart, w - 36, rowHeight);
            ctx.strokeStyle = "#e6ebf2";
            ctx.beginPath();
            ctx.moveTo(x + 18, rowStart + rowHeight);
            ctx.lineTo(x + w - 18, rowStart + rowHeight);
            ctx.stroke();
            let colX = x + 24;
            row.forEach((cell, index) => {
              drawText(cell, colX, rowStart + 19, colWidths[index] - 12, { fontSize: 13, weight: rowIndex === 0 ? 700 : 400, color: rowIndex === 0 ? "#475467" : "#1f2933", lineHeight: 18 });
              colX += colWidths[index];
            });
            y += rowHeight;
          });
          y += 18;
          outlineCard(x, start, w, y - start);
          return y + 14;
        };
        const drawInputs = (x, y, w) => {
          const start = y;
          y += 18;
          y = drawText("Input Parameters", x + 18, y, w - 36, { fontSize: 18, weight: 700, lineHeight: 24 }) + 10;
          [...document.querySelectorAll(".inputs > *")].forEach(el => {
            if (el.classList?.contains("section-title")) {
              y += 8;
              y = drawText(getText(el), x + 18, y, w - 36, { fontSize: 15, weight: 700, color: "#0f766e", lineHeight: 22 }) + 4;
              return;
            }
            if (el.tagName === "LABEL") {
              const control = el.querySelector("input, select");
              const controlText = getText(control);
              const label = getText(el).replace(controlText, "").trim();
              const value = control?.tagName === "SELECT" ? getText(control.selectedOptions[0]) : control?.value;
              y = drawText(`${label}: ${value ?? ""}`, x + 18, y, w - 36, { fontSize: 13, color: "#344054", lineHeight: 20 });
            }
          });
          y += 18;
          outlineCard(x, start, w, y - start);
          return y;
        };
        const drawKpis = (x, y, w) => {
          const cards = [...document.querySelectorAll(".kpi")];
          const cardW = (w - 18) / 2;
          cards.forEach((item, index) => {
            const cx = x + (index % 2) * (cardW + 18);
            const cy = y + Math.floor(index / 2) * 112;
            card(cx, cy, cardW, 96);
            drawText(getText(item.querySelector(".label")), cx + 14, cy + 24, cardW - 28, { fontSize: 13, color: "#667085" });
            drawText(getText(item.querySelector(".value")), cx + 14, cy + 54, cardW - 28, { fontSize: 24, weight: 800, lineHeight: 28 });
            drawText(getText(item.querySelector(".note")), cx + 14, cy + 78, cardW - 28, { fontSize: 11, color: "#667085", lineHeight: 15 });
          });
          return y + Math.ceil(cards.length / 2) * 112 + 12;
        };

        ctx.fillStyle = "#f6f7f9";
        ctx.fillRect(0, 0, width, maxHeight);
        let y = padding;
        y = drawText(getText(document.querySelector("header h1")) || "Report", padding, y, width - padding * 2, { fontSize: 28, weight: 800, lineHeight: 36 });
        y = drawText(`${new Date().toLocaleString("zh-CN")}    ${provinceConfig(getInputs()).name}`, padding, y + 4, width - padding * 2, { fontSize: 14, color: "#667085", lineHeight: 22 }) + 18;
        const leftY = drawInputs(padding, y, leftWidth);
        let rightY = drawKpis(padding + leftWidth + gap, y, rightWidth);
        document.querySelectorAll(".results .panel.content:not(#accountPanel)").forEach(panel => {
          const title = getText(panel.querySelector("h2"));
          panel.querySelectorAll("table").forEach((table, index) => {
            const rows = rowsFromTable(table);
            if (rows.length) rightY = drawTablePanel(index ? `${title} - table` : title, rows, padding + leftWidth + gap, rightY, rightWidth);
          });
          const formula = panel.querySelector(".formula");
          if (formula) {
            const rows = [...formula.children].map(item => [getText(item)]);
            rightY = drawTablePanel(title, [["Logic"], ...rows], padding + leftWidth + gap, rightY, rightWidth);
          }
        });

        const finalHeight = Math.min(Math.ceil(Math.max(leftY, rightY) + padding), maxHeight);
        const output = document.createElement("canvas");
        output.width = width;
        output.height = finalHeight;
        output.getContext("2d").drawImage(canvas, 0, 0);
        const blob = await new Promise(resolve => output.toBlob(resolve, "image/png", 1));
        if (!blob) throw new Error("PNG export failed");
        const provinceName = provinceConfig(getInputs()).name;
        const dateText = new Date().toISOString().slice(0, 10);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ev-calc-${provinceName}-${dateText}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error(error);
        alert(`Export failed: ${error.message || error}`);
      } finally {
        button.textContent = originalText;
        button.disabled = false;
      }
    }

