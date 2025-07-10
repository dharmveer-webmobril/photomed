export function validateEmail(email) {
    var re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  export function validateName(name) {
    var re = /^[a-zA-Z ]+$/;
    return re.test(String(name).toLowerCase());
  }
  
  export function validateNameLength(name) {
    if (String(name.length) < 3 || String(name.length) >20) 
      return true
      else 
      return false
  }
  
  export function validateNameProfile(name) {
    if (String(name.length) < 2) 
      return true
      else 
      return false
  }
  
  export function validatePhoneWithCountryCode(phone) {
    var re = /^\+[1-9]{1}[0-9]{9,14}$/;
    return re.test(String(phone));
  }
  export function validatePhone(phone) {
    var re = /^[0-]9{1,20}$/
    //var re = /([7-9][0-9]{6})$/
    //var re = /^([0|\+[0-9]{1,5})?([7-9][0-9]{9,})$/;
    return re.test(String(phone));
  }
  
  export function matchPassword(password, confirm) {
    if (password == confirm) {
      return true;
    } else return false;
  }
  
  export function validatePassword(password) {
    let reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
    return reg.test(String(password));
  }
  
  export function validateCountryCode(country) {
    let reg = /^\+(\d{1}\-)?(\d{1,3})$/;
    return reg.test(String(country));
  }
  export function validatePhoneLength(phone) {
    if (String(phone.length) >= 6 && String(phone.length) <= 15) 
      return true
      else 
      return false
  }
  
  export function validatePasswordLength(phone) {
    if (String(phone.length) >= 6 && String(phone.length) <= 16) 
      return true
      else 
      return false
  }
  
  export function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }