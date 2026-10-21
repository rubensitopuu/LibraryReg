const registrationForm = document.querySelector("#registrationForm");

if (registrationForm) {
  const registrationMessage = document.querySelector("#registrationMessage");
  const requiredFields = [...registrationForm.querySelectorAll("[required]")];

  const showMessage = (message, type) => {
    registrationMessage.textContent = message;
    registrationMessage.className = `alert registration-message alert-${type}`;
  };

  const validateField = (field) => {
    field.setCustomValidity("");
    const value = field.value.trim();
    let message = "";

    if (!value) {
      message = field.id === "membershipType"
        ? "Pilih jenis keanggotaan."
        : `${field.labels[0].textContent} wajib diisi.`;
    } else if (field.id === "nrp" && !/^\d+$/.test(value)) {
      message = "NRP wajib diisi dengan angka saja.";
    } else if (field.type === "email" && (
      field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )) {
      message = "Masukkan alamat email yang valid.";
    }

    field.setCustomValidity(message);
    field.classList.toggle("is-invalid", Boolean(message));
    field.classList.toggle("is-valid", !message);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  };

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        validateField(field);
      }
    });
    field.addEventListener("change", () => validateField(field));
  });

  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    registrationMessage.classList.add("d-none");

    const invalidFields = requiredFields.filter((field) => !validateField(field));
    if (invalidFields.length > 0) {
      showMessage("Periksa kembali formulir. Lengkapi semua data yang wajib diisi dengan format yang benar.", "danger");
      invalidFields[0].focus();
      return;
    }

    const member = Object.fromEntries(
      [...new FormData(registrationForm).entries()].map(([name, value]) => [name, value.trim()])
    );
    const storageKey = "libraryreg.members";

    try {
      const savedMembers = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (!Array.isArray(savedMembers)) {
        throw new TypeError("Format data pendaftaran yang tersimpan tidak valid.");
      }

      localStorage.setItem(storageKey, JSON.stringify([...savedMembers, member]));
    } catch (error) {
      showMessage("Data belum tersimpan. Penyimpanan browser tidak tersedia atau data sebelumnya bermasalah. Silakan coba lagi.", "danger");
      console.error("Gagal menyimpan pendaftaran anggota ke localStorage.", error);
      return;
    }

    registrationForm.reset();
    requiredFields.forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    });
    showMessage("Pendaftaran berhasil! Data anggota sudah tersimpan di perangkat ini.", "success");
  });

  registrationForm.addEventListener("reset", () => {
    requiredFields.forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    });
    registrationMessage.classList.add("d-none");
  });
}
