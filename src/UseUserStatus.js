import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export const useUserStatus = (userId) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("users")
        .select("is_suspended, chat_disabled, suspension_reason")
        .eq("id", userId)
        .single();

      setStatus(data);
    };

    fetchStatus();
  }, [userId]);

  return status;
};