document.querySelectorAll('.otp-input input').forEach((input, index, inputs) => {
  // กรองให้กรอกเฉพาะตัวเลข
  input.addEventListener('input', (e) => {
    const value = e.target.value;
    if (!/^\d$/.test(value)) {
      e.target.value = ''; // ล้างค่าที่ไม่ใช่ตัวเลข
      return;
    }
    if (index < inputs.length - 1) {
      inputs[index + 1].focus(); // ย้ายโฟกัสไปช่องถัดไป
    }
  });

  // ย้ายโฟกัสกลับเมื่อกด Backspace
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputs[index - 1].focus();
    }
  });

  // เพิ่ม class เมื่อ focus
  input.addEventListener('focus', () => {
    input.classList.add('active');
  });

  // ลบ class เมื่อ blur
  input.addEventListener('blur', () => {
    input.classList.remove('active');
  });
});