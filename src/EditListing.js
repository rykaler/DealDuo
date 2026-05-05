import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./EditListing.css";

export default function EditListing({ id, onClose }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState(""); // ✅ CHANGED

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setTitle(data.title || "");
      setPrice(data.price || "");
      setDescription(data.description || ""); // ✅ CHANGED
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("listings")
      .update({
        title,
        price,
        description, // ✅ CHANGED
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Updated successfully!");
    onClose();
  };

  return (
    <div className="edit-overlay">
      <div className="edit-card">

        <h2>EDIT LISTING</h2>
        <p className="subtitle">Update your item details</p>

        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Price</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {/* ✅ DESCRIPTION INSTEAD OF LOCATION */}
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button className="update-btn" onClick={handleUpdate}>
          UPDATE
        </button>

        <button className="back-btn" onClick={onClose}>
          CANCEL
        </button>

      </div>
    </div>
  );
}