const bodyPage = document.body.dataset.page;
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    if (link.dataset.nav === bodyPage) {
      link.classList.add("active");
    }

    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealItems.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const contactForm = document.querySelector("#contato-form");
const bookingForm = document.querySelector("#agendamento-form");
const bookingDate = document.querySelector("#booking-date");
const siteConfig = window.CLINICA_CONFIG || {};
const googleAppsScriptUrl = siteConfig.googleAppsScriptUrl || "";

if (bookingDate) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  bookingDate.min = `${year}-${month}-${day}`;
}

const setFeedback = (element, message, type) => {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("is-success", "is-error");
  if (type === "success") element.classList.add("is-success");
  if (type === "error") element.classList.add("is-error");
};

const submitToGoogleSheets = async (payload) => {
  if (!googleAppsScriptUrl) {
    return { ok: true, demo: true };
  }

  await fetch(googleAppsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return { ok: true, demo: false };
};

if (contactForm) {
  const feedback = document.querySelector("#contato-feedback");

  contactForm.addEventListener("submit", (event) => {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      setFeedback(feedback, "Preencha os campos obrigatórios antes de enviar.", "error");
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const payload = {
      tipo: "contato",
      nome: formData.get("nome"),
      email: formData.get("email"),
      telefone: formData.get("telefone") || "",
      mensagem: formData.get("mensagem")
    };

    if (submitButton) submitButton.disabled = true;
    setFeedback(feedback, "Enviando mensagem...", "success");

    submitToGoogleSheets(payload)
      .then(() => {
        contactForm.reset();
        setFeedback(feedback, "Mensagem enviada com sucesso! Entraremos em contato em breve!", "success");
      })
      .catch(() => {
        setFeedback(feedback, "Não foi possível enviar agora. Tente novamente em alguns instantes.", "error");
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });
}

if (bookingForm) {
  const feedback = document.querySelector("#agendamento-feedback");

  bookingForm.addEventListener("submit", (event) => {
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    event.preventDefault();
    if (!bookingForm.checkValidity()) {
      setFeedback(feedback, "Preencha os campos obrigatórios antes de solicitar.", "error");
      bookingForm.reportValidity();
      return;
    }

    const formData = new FormData(bookingForm);
    const nome = formData.get("nome");
    const data = formData.get("data");
    const periodo = formData.get("periodo");
    const payload = {
      tipo: "agendamento",
      nome,
      telefone: formData.get("telefone"),
      email: formData.get("email"),
      data,
      periodo,
      mensagem: formData.get("mensagem") || ""
    };

    if (submitButton) submitButton.disabled = true;
    setFeedback(feedback, "Enviando agendamento...", "success");

    submitToGoogleSheets(payload)
      .then(() => {
        bookingForm.reset();
        setFeedback(feedback, `Agendamento enviado com sucesso! ${nome}, recebemos sua solicitação para ${data} no período da ${periodo}. Entraremos em contato em breve!`, "success");
      })
      .catch(() => {
        setFeedback(feedback, "Não foi possível enviar o agendamento agora. Tente novamente em alguns instantes.", "error");
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });
}
