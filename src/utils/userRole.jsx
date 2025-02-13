import { useEffect, useState } from "react";
import { supabase } from "../config/supabase"; 

const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) {
        setLoading(false);
        return;
      }

      const { data, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.user.id)
        .single();

      console.log("role in userRole", data.role);

      if (!roleError && data) setRole(data.role);
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  return { role, loading };
};

export default useUserRole;