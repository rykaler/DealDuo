import React, { useState } from "react";

import { supabase }
from "./supabaseClient";

import "./AddListing.css";

const AddListing = ({
  goBack,
}) => {

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("Electronics");

  const [condition, setCondition] =
    useState("New");

  const [price, setPrice] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit =
    async (e) => {

    e.preventDefault();

    if (
      !title ||
      !price ||
      !image
    ) {

      alert(
        "Please fill all required fields"
      );

      return;
    }

    setLoading(true);

    try {

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {

        alert(
          "Login required!"
        );

        setLoading(false);

        return;
      }

      // FILE NAME
      const fileName =
        `${user.id}-${Date.now()}-${image.name}`;

      // UPLOAD IMAGE
      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("listings")
          .upload(
            fileName,
            image
          );

      if (uploadError)
        throw uploadError;

      // GET IMAGE URL
      const { data } =
        supabase.storage
          .from("listings")
          .getPublicUrl(
            fileName
          );

      const imageUrl =
        data.publicUrl;

      // INSERT DB
      const {
        error: dbError,
      } =
        await supabase
          .from("listings")
          .insert([
            {
              title,
              category,
              condition,
              price,
              description,
              image_url:
                imageUrl,
              user_id: user.id,
            },
          ]);

      if (dbError)
        throw dbError;

      alert(
        "Listing posted successfully!"
      );

      goBack();

    } catch (err) {

      alert(err.message);

    }

    setLoading(false);
  };

  return (

    <div className="add-page">

      <div className="add-card">

        {/* BACK */}
        <button
          type="button"
          className="top-back-btn"
          onClick={goBack}
        >
          ← Back
        </button>

        {/* TITLE */}
        <h2>
          POST NEW DEAL
        </h2>

        <p className="subtitle">
          Sell your item in seconds
        </p>

        {/* FORM */}
        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* IMAGE */}
          <input
            type="file"
            onChange={(e) =>
              setImage(
                e.target.files[0]
              )
            }
          />

          {/* TITLE */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
          />

          {/* CATEGORY */}
          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >

            <option>
              Books
            </option>

            <option>
              Uniforms
            </option>

            <option>
              Electronics
            </option>

          </select>

          {/* CONDITION */}
          <select
            value={condition}
            onChange={(e) =>
              setCondition(
                e.target.value
              )
            }
          >

            <option>
              New
            </option>

            <option>
              Used
            </option>

          </select>

          {/* PRICE */}
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value
              )
            }
          />

          {/* DESCRIPTION */}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          {/* SUBMIT */}
          <button
            className="submit-btn"
            disabled={loading}
          >

            {loading
              ? "Posting..."
              : "SUBMIT LISTING"}

          </button>
              
        </form>

      </div>

    </div>
  );
};

export default AddListing;