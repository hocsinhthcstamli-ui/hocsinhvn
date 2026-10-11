import { puzzlePacks, shuffledPieces } from "./puzzle-catalog.mjs";
const positions = ["trên bên trái", "trên bên phải", "dưới bên trái", "dưới bên phải"];

class PicturePuzzle extends HTMLElement {
  connectedCallback() {
    this.pack = puzzlePacks[this.getAttribute("journey")];
    if (!this.pack) { this.textContent = "Bộ ảnh đang được chuẩn bị."; return; }
    this.completed = new Set();
    this.events = new AbortController();
    this.addEventListener("click", e => this.click(e), { signal: this.events.signal });
    this.addEventListener("pointerdown", e => this.startDrag(e), { signal: this.events.signal });
    document.addEventListener("pointermove", e => this.moveDrag(e), { signal: this.events.signal });
    document.addEventListener("pointerup", e => this.endDrag(e), { signal: this.events.signal });
    document.addEventListener("pointercancel", () => this.cancelDrag(), { signal: this.events.signal });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.cancelDrag(); }, { signal: this.events.signal });
    this.gallery();
  }
  disconnectedCallback() { this.events?.abort(); this.cancelDrag(); }
  gallery() {
    this.cancelDrag();
    this.innerHTML = `<div class="puzzle-heading"><p class="eyebrow">CHƠI CÙNG HÌNH ẢNH</p><h2>Ghép ảnh 4 mảnh</h2><p>Chọn một bức tranh con thích. Có ${this.pack.length} tranh để khám phá!</p><p>${this.completed.size}/${this.pack.length} tranh đã ghép trong lần chơi này</p></div><div class="puzzle-gallery">${this.pack.map((p, i) => `<button class="puzzle-choice" data-puzzle="choose" data-index="${i}"><img src="${p.src}" alt="" width="240" height="240" loading="lazy"><strong>${p.title}</strong><span>${this.completed.has(i) ? "✓ Đã ghép" : "4 mảnh · Chạm để chơi"}</span></button>`).join("")}</div>`;
  }
  start(index) {
    this.cancelDrag();
    this.mistakes = 0; this.index = index; this.order = shuffledPieces(); this.placed = new Set(); this.selected = null;
    const picture = this.pack[index];
    this.innerHTML = `<section class="puzzle-play"><div class="puzzle-toolbar"><button class="secondary" data-puzzle="gallery">← Chọn tranh</button><span>Tranh ${index + 1}/${this.pack.length}</span><button class="secondary" data-puzzle="restart">Trộn lại</button></div><h2 tabindex="-1">${picture.title}</h2><p>Kéo mảnh vào ô, hoặc chạm mảnh rồi chạm ô.</p><div class="puzzle-layout"><div><div class="puzzle-board" aria-label="Bảng ghép 4 ô">${positions.map((pos, i) => `<button class="puzzle-slot" data-slot="${i}" data-puzzle="place" aria-label="Ô ${pos}"><span>${i + 1}</span></button>`).join("")}</div><p class="puzzle-status" role="status" aria-live="polite">Chọn một mảnh để bắt đầu.</p><div class="puzzle-tray" aria-label="Các mảnh đã trộn">${this.order.map((piece, i) => `<button class="puzzle-piece" data-piece="${piece}" data-puzzle="piece" aria-label="Mảnh ${i + 1}" aria-pressed="false"><span class="puzzle-piece-number">${i + 1}</span></button>`).join("")}</div></div><aside class="puzzle-reference"><details open><summary>Xem ảnh mẫu</summary><img src="${picture.src}" alt="Ảnh mẫu: ${picture.title}" width="320" height="320"></details><p class="puzzle-count">Đã ghép <strong>0/4</strong> mảnh</p><div class="puzzle-result" hidden><img class="puzzle-reward" src="/assets/art/buddy-success.webp" alt="" width="90" height="90"><h3>Con ghép xong rồi!</h3><button class="primary" data-puzzle="next">${index === this.pack.length - 1 ? "Về bộ tranh" : "Chơi tranh tiếp theo →"}</button><button class="secondary" data-puzzle="restart">Chơi lại tranh này</button></div></aside></div></section>`;
    this.querySelectorAll(".puzzle-piece").forEach(button => { button.style.cssText = this.styleFor(Number(button.dataset.piece)); });
    this.querySelector("h2").focus();
  }
  styleFor(piece) { return `background-image:url('${this.pack[this.index].src}');background-position:${piece % 2 * 100}% ${Math.floor(piece / 2) * 100}%`; }
  say(text) { this.querySelector(".puzzle-status").textContent = text; }
  select(piece) {
    if (this.placed.has(piece)) return;
    this.selected = piece;
    this.querySelectorAll(".puzzle-piece").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.piece) === piece)));
    this.say("Đã chọn mảnh. Con chọn ô muốn ghép nhé.");
  }
  place(slot) {
    if (this.selected === null) { this.say("Con chọn một mảnh trước nhé."); return; }
    if (this.placed.has(slot)) { this.say("Ô này đã ghép xong. Con chọn ô khác nhé."); return; }
    if (slot !== this.selected) { this.mistakes++; this.say("Mảnh này chưa khớp. Con thử ô khác nhé."); return; }
    const piece = this.selected;
    this.placed.add(piece); this.selected = null;
    const target = this.querySelector(`[data-slot="${slot}"]`);
    target.style.cssText = this.styleFor(piece); target.classList.add("filled");
    target.setAttribute("aria-label", `Ô ${positions[slot]} đã ghép đúng`); target.setAttribute("aria-disabled", "true");
    target.innerHTML = '<span class="puzzle-check">✓</span>';
    const source = this.querySelector(`[data-piece="${piece}"]`);
    source.disabled = true; source.setAttribute("aria-pressed", "false"); source.classList.add("placed");
    this.querySelector(".puzzle-count strong").textContent = `${this.placed.size}/4`;
    if (this.placed.size === 4) {
      this.completed.add(this.index);
      this.dispatchEvent(new CustomEvent("learning-result",{bubbles:true,detail:{kind:"puzzle",itemId:this.pack[this.index].id,total:4,completed:4,mistakes:this.mistakes}}));
      this.querySelector(".puzzle-result").hidden = false;
      this.say("✓ Con ghép đúng cả bức tranh rồi!");
      this.querySelector('[data-puzzle="next"]').focus({preventScroll:true});
    } else {
      this.say(`✓ Đúng rồi! Đã ghép ${this.placed.size}/4 mảnh.`);
      this.querySelector(".puzzle-piece:not(:disabled)")?.focus({preventScroll:true});
    }
  }
  click(e) {
    if (this.suppressClick && e.detail > 0) return;
    const button = e.target.closest("[data-puzzle]");
    if (!button || button.disabled) return;
    switch (button.dataset.puzzle) {
      case "choose": this.start(Number(button.dataset.index)); break;
      case "gallery": this.gallery(); this.querySelector("button")?.focus(); break;
      case "restart": this.start(this.index); break;
      case "next": this.index + 1 < this.pack.length ? this.start(this.index + 1) : this.gallery(); break;
      case "piece": this.select(Number(button.dataset.piece)); break;
      case "place": this.place(Number(button.dataset.slot)); break;
    }
  }
  startDrag(e) {
    const button = e.target.closest(".puzzle-piece:not(:disabled)");
    if (!button || !e.isPrimary || e.button !== 0 || this.drag) return;
    this.drag = {id:e.pointerId, x:e.clientX, y:e.clientY, button, piece:Number(button.dataset.piece)};
    button.setPointerCapture(e.pointerId);
  }
  moveDrag(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.ghost && Math.hypot(e.clientX-d.x, e.clientY-d.y) < 8) return;
    e.preventDefault();
    if (!d.ghost) {
      this.select(d.piece);
      d.ghost = document.createElement("div"); d.ghost.className = "puzzle-drag-ghost";
      d.ghost.style.cssText = this.styleFor(d.piece);
      const size = d.button.getBoundingClientRect().width;
      d.ghost.style.width = d.ghost.style.height = `${size}px`;
      document.body.append(d.ghost);
    }
    d.ghost.style.left = `${e.clientX}px`; d.ghost.style.top = `${e.clientY}px`;
    const slot = document.elementFromPoint(e.clientX,e.clientY)?.closest(".puzzle-slot");
    this.querySelectorAll(".puzzle-slot").forEach(s => s.classList.toggle("drop-target", s === slot));
  }
  endDrag(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    if (d.ghost) {
      const slot = document.elementFromPoint(e.clientX,e.clientY)?.closest(".puzzle-slot");
      this.suppressClick = true;
      if (slot && this.contains(slot)) this.place(Number(slot.dataset.slot));
      else this.say("Con thả mảnh vào một ô trên bảng nhé.");
      setTimeout(() => {this.suppressClick = false;}, 0);
    }
    this.cancelDrag();
  }
  cancelDrag() {
    const d = this.drag;
    if (d?.button.hasPointerCapture(d.id)) d.button.releasePointerCapture(d.id);
    d?.ghost?.remove(); this.drag = null;
    this.querySelectorAll(".drop-target").forEach(s => s.classList.remove("drop-target"));
  }
}
customElements.define("picture-puzzle", PicturePuzzle);
