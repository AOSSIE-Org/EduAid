import { toast } from "react-toastify";
export const handleToastNotifs = async (promise, clr_fn, messages) => {
  try {
    await toast.promise(promise, messages);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    clr_fn();
  }
};
