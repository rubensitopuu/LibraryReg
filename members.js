const membersStorageKey = "libraryreg.members";
const membersTableBody = document.querySelector("#membersTableBody");

if (membersTableBody) {
  const membersMessage = document.querySelector("#membersMessage");
  const membersEmpty = document.querySelector("#membersEmpty");
  const membersSearch = document.querySelector("#memberSearch");
  const memberTypeFilter = document.querySelector("#memberTypeFilter");
  const studyProgramFilter = document.querySelector("#studyProgramFilter");
  const membersCount = document.querySelector("#membersCount");
  const editForm = document.querySelector("#memberEditForm");
  const editErrorMessage = document.querySelector("#editErrorMessage");
  const detailModal = bootstrap.Modal.getOrCreateInstance(document.querySelector("#memberDetailModal"));
  const editModal = bootstrap.Modal.getOrCreateInstance(document.querySelector("#memberEditModal"));
  const deleteModal = bootstrap.Modal.getOrCreateInstance(document.querySelector("#memberDeleteModal"));
  const detailFields = [
    ["Nama lengkap", "fullName"],
    ["NRP", "nrp"],
    ["Program studi", "studyProgram"],
    ["Alamat", "address"],
    ["Nomor telepon", "phone"],
    ["Email", "email"],
    ["Jenis keanggotaan", "membershipType"]
  ];
  let members = [];
  let selectedMemberIndex = -1;

  const showMembersMessage = (message, type) => {
    membersMessage.textContent = message;
    membersMessage.className = `alert members-message alert-${type}`;
  };

  const loadMembers = () => {
    const storedMembers = JSON.parse(localStorage.getItem(membersStorageKey) ?? "[]");
    if (!Array.isArray(storedMembers)) {
      throw new TypeError("Data anggota tersimpan bukan berupa daftar.");
    }

    return storedMembers.filter(
      (member) => member && typeof member === "object" && !Array.isArray(member)
    );
  };

  const createCell = (value, className = "") => {
    const cell = document.createElement("td");
    cell.textContent = value;
    if (className) {
      cell.className = className;
    }
    return cell;
  };

  const createActionButton = (label, action, className = "") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `member-action ${className}`.trim();
    button.dataset.action = action;
    button.textContent = label;
    return button;
  };

  const renderMembers = () => {
    const query = membersSearch.value.trim().toLocaleLowerCase("id");
    const selectedType = memberTypeFilter.value;
    const selectedProgram = studyProgramFilter.value;
    const matches = members
      .map((member, index) => ({ member, index }))
      .filter(({ member }) => (
        (!selectedType || member.membershipType === selectedType)
        && (!selectedProgram || member.studyProgram === selectedProgram)
        && [
          member.fullName,
          member.nrp,
          member.studyProgram,
          member.membershipType
        ].some((value) => String(value ?? "").toLocaleLowerCase("id").includes(query))
      ));

    membersTableBody.replaceChildren();
    membersEmpty.classList.toggle("d-none", matches.length > 0);
    membersTableBody.closest("table").classList.toggle("d-none", matches.length === 0);

    if (members.length === 0) {
      document.querySelector("#membersEmptyTitle").textContent = "Belum ada data anggota";
      document.querySelector("#membersEmptyDescription").textContent = "Data anggota yang mendaftar akan muncul di sini.";
    } else if (matches.length === 0) {
      document.querySelector("#membersEmptyTitle").textContent = "Anggota tidak ditemukan";
      document.querySelector("#membersEmptyDescription").textContent = "Coba kata kunci pencarian yang lain.";
    }

    matches.forEach(({ member, index }, visibleIndex) => {
      const row = document.createElement("tr");
      row.append(
        createCell(String(visibleIndex + 1), "member-number"),
        createCell(member.fullName ?? ""),
        createCell(member.nrp ?? "", "member-nrp"),
        createCell(member.studyProgram ?? ""),
        createCell(member.membershipType ?? "", "member-type"),
      );

      const actionsCell = document.createElement("td");
      actionsCell.className = "member-actions-cell";
      actionsCell.append(
        createActionButton("Detail", "detail"),
        createActionButton("Edit", "edit"),
        createActionButton("Hapus", "delete", "delete-action")
      );
      row.append(actionsCell);
      row.dataset.memberIndex = String(index);
      membersTableBody.append(row);
    });

    membersCount.textContent = matches.length === 0
      ? `Menampilkan 0 dari ${members.length} data`
      : `Menampilkan 1–${matches.length} dari ${members.length} data`;
  };

  const saveMembers = (updatedMembers) => {
    localStorage.setItem(membersStorageKey, JSON.stringify(updatedMembers));
    members = updatedMembers;
    refreshFilters();
    renderMembers();
  };

  const refreshFilters = () => {
    [
      [memberTypeFilter, "Semua jenis", "membershipType"],
      [studyProgramFilter, "Semua program studi", "studyProgram"]
    ].forEach(([select, defaultLabel, property]) => {
      const selectedValue = select.value;
      const values = [...new Set(
        members.map((member) => String(member[property] ?? "").trim()).filter(Boolean)
      )].sort((left, right) => left.localeCompare(right, "id"));
      select.replaceChildren(new Option(defaultLabel, ""));
      values.forEach((value) => select.add(new Option(value, value)));
      select.value = values.includes(selectedValue) ? selectedValue : "";
    });
  };

  const validateEditField = (field) => {
    field.setCustomValidity("");
    const value = field.value.trim();
    let error = "";

    if (!value) {
      error = field.id === "editMembershipType"
        ? "Pilih jenis keanggotaan."
        : `${field.labels[0].textContent} wajib diisi.`;
    } else if (field.id === "editNrp" && !/^\d+$/.test(value)) {
      error = "NRP wajib diisi dengan angka saja.";
    } else if (field.type === "email" && (
      field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )) {
      error = "Masukkan alamat email yang valid.";
    }

    field.setCustomValidity(error);
    field.classList.toggle("is-invalid", Boolean(error));
    field.classList.toggle("is-valid", !error);
    field.setAttribute("aria-invalid", String(Boolean(error)));
    return !error;
  };

  try {
    members = loadMembers();
    refreshFilters();
    renderMembers();
  } catch (error) {
    membersEmpty.classList.remove("d-none");
    membersTableBody.closest("table").classList.add("d-none");
    document.querySelector("#membersEmptyTitle").textContent = "Data anggota tidak dapat dibaca";
    document.querySelector("#membersEmptyDescription").textContent = "Periksa penyimpanan browser lalu muat ulang halaman.";
    membersCount.textContent = "Data anggota tidak tersedia";
    showMembersMessage("Terjadi kesalahan saat membaca data anggota dari penyimpanan browser.", "danger");
    console.error("Gagal membaca data anggota dari localStorage.", error);
  }

  membersSearch.addEventListener("input", renderMembers);
  memberTypeFilter.addEventListener("change", renderMembers);
  studyProgramFilter.addEventListener("change", renderMembers);

  membersTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    selectedMemberIndex = Number(button.closest("tr").dataset.memberIndex);
    const member = members[selectedMemberIndex];
    if (!member) {
      showMembersMessage("Data anggota sudah berubah. Muat ulang daftar, lalu coba lagi.", "danger");
      return;
    }

    if (button.dataset.action === "detail") {
      const detailList = document.querySelector("#memberDetailList");
      detailList.replaceChildren();
      detailFields.forEach(([label, property]) => {
        const term = document.createElement("dt");
        term.textContent = label;
        const description = document.createElement("dd");
        description.textContent = member[property] || "—";
        detailList.append(term, description);
      });
      detailModal.show();
      return;
    }

    if (button.dataset.action === "edit") {
      detailFields.forEach(([, property]) => {
        const field = editForm.elements.namedItem(property);
        field.value = member[property] ?? "";
        field.classList.remove("is-valid", "is-invalid");
        field.removeAttribute("aria-invalid");
        field.setCustomValidity("");
      });
      editErrorMessage.className = "alert d-none edit-error-message";
      editModal.show();
      return;
    }

    document.querySelector("#memberDeleteDescription").textContent =
      `Hapus data anggota ${member.fullName || "ini"} dari perangkat? Tindakan ini tidak dapat dibatalkan.`;
    deleteModal.show();
  });

  editForm.querySelectorAll("[required]").forEach((field) => {
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        validateEditField(field);
      }
    });
    field.addEventListener("change", () => validateEditField(field));
  });

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    editErrorMessage.classList.add("d-none");
    const fields = [...editForm.querySelectorAll("[required]")];
    const invalidFields = fields.filter((field) => !validateEditField(field));

    if (invalidFields.length > 0) {
      editErrorMessage.textContent = "Lengkapi semua data dengan format yang benar.";
      editErrorMessage.className = "alert alert-danger edit-error-message";
      invalidFields[0].focus();
      return;
    }

    if (selectedMemberIndex < 0 || !members[selectedMemberIndex]) {
      editErrorMessage.textContent = "Data anggota tidak ditemukan. Tutup formulir dan muat ulang daftar.";
      editErrorMessage.className = "alert alert-danger edit-error-message";
      return;
    }

    const updatedMember = Object.fromEntries(
      [...new FormData(editForm).entries()].map(([name, value]) => [name, value.trim()])
    );
    const updatedMembers = members.map((member, index) =>
      index === selectedMemberIndex ? updatedMember : member
    );

    try {
      saveMembers(updatedMembers);
      editModal.hide();
      showMembersMessage("Data anggota berhasil diperbarui.", "success");
    } catch (error) {
      editErrorMessage.textContent = "Perubahan tidak tersimpan. Penyimpanan browser tidak tersedia.";
      editErrorMessage.className = "alert alert-danger edit-error-message";
      console.error("Gagal memperbarui data anggota di localStorage.", error);
    }
  });

  document.querySelector("#confirmDeleteMember").addEventListener("click", () => {
    if (selectedMemberIndex < 0 || !members[selectedMemberIndex]) {
      deleteModal.hide();
      showMembersMessage("Data anggota tidak ditemukan. Muat ulang daftar, lalu coba lagi.", "danger");
      return;
    }

    const remainingMembers = members.filter((_, index) => index !== selectedMemberIndex);
    try {
      saveMembers(remainingMembers);
      deleteModal.hide();
      selectedMemberIndex = -1;
      showMembersMessage("Data anggota berhasil dihapus.", "success");
    } catch (error) {
      deleteModal.hide();
      showMembersMessage("Data anggota tidak dapat dihapus karena penyimpanan browser bermasalah.", "danger");
      console.error("Gagal menghapus data anggota dari localStorage.", error);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== membersStorageKey && event.key !== null) {
      return;
    }

    try {
      members = loadMembers();
      refreshFilters();
      membersMessage.classList.add("d-none");
      renderMembers();
    } catch (error) {
      showMembersMessage("Data anggota berubah, tetapi tidak dapat dibaca dari penyimpanan browser.", "danger");
      console.error("Gagal menyegarkan data anggota dari localStorage.", error);
    }
  });
}
