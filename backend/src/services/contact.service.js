import Contact from "../models/contact.model.js";

export const createContact = async ({
  name, email, phone, message
}) => {
  if (!name || !email || !message) {
    throw new Error('All fields are required');
  }

  const contact = await Contact.create({
    name, email, phone, message
  });

  return contact;
}