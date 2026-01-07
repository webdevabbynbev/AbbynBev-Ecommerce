"use client";
import { updateProfile, getUser } from "@/services/auth";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TxtField,
} from "@/components";
import { useState, useEffect } from "react";
import { FaPen } from "react-icons/fa";

const GENDER_OPTIONS = [
  { id: 1, label: "Male" },
  { id: 2, label: "Female" },
];

export function EditProfile({ onProfileUpdated }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    gender: "",
    photo_profile: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getUser();
        const u = data?.user || data?.serve || null;
        setUser(u);
        if (u) {
          setFormData({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            phoneNumber: u.phoneNumber || "",
            email: u.email || "",
            gender: u.gender ?? "",
            photoProfile: null,
          });
        }
      } catch (e) {
        setMessage("Gagal mengambil data profil");
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((p) => ({ ...p, photoProfile: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // >>> FE ONLY: mapping camelCase -> snake_case (yang diminta backend)
      const payload = {
        first_name: formData.firstName || undefined,
        last_name: formData.lastName || undefined,
        phone_number: formData.phoneNumber || undefined,
        gender: formData.gender ?? undefined,
        email: formData.email || undefined, // pastikan angka (1/2)
      };

      // bersihkan key undefined supaya body rapih
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );
      await updateProfile(payload);

      // refetch profil agar UI langsung sinkron
      const { user: fresh } = await getUser();
      if (fresh) {
        setUser(fresh);
        setFormData({
          firstName: fresh.firstName || "",
          lastName: fresh.lastName || "",
          phoneNumber: fresh.phoneNumber || "",
          email: fresh.email || "",
          gender: fresh.gender ?? "",
          photoProfile: null,
        });
        onProfileUpdated?.(fresh);
      }

      setOpen(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage(err.message || "Gagal update profil");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Button variant="tertiary" size="sm" iconName="Edit" disabled>
        Loading...
      </Button>
    );
  }

  const photoUrl = user.photoProfile
    ? `${process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")}/${
        user.photoProfile
      }`
    : "/default-avatar.png";

  return (
    <Dialog
      open={open}
      onOpenChange={async (v) => {
        setOpen(v);
        if (v) {
          try {
            const { user: fresh } = await getUser();
            const u = fresh || user;
            if (u) {
              setUser(u);
              setFormData({
                firstName: u.firstName || "",
                lastName: u.lastName || "",
                phoneNumber: u.phoneNumber || "",
                email: u.email || "",
                gender: u.gender ?? "",
                photoProfile: null,
              });
            }
          } catch {}
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="tertiary"
          size="sm"
          iconName="Edit"
        >
          Edit Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col sm:max-w-[300px] md:max-w-[425px] h-[80%] overflow-y-auto overflow-x-hidden custom-scrollbar justify-start items-start">
        <DialogHeader className="w-full">
          <DialogTitle className="flex gap-2">
            Edit profile
          </DialogTitle>
        

        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-[100%] space-y-2  h-full p-2"
        >
          <div className="space-y-2">
          <div className="w-full flex flex-col sm:flex-row gap-4">
            <TxtField
              className="flex-1"
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={user?.firstName || "Enter your first name"}
              variant="outline"
              size="sm"
            />
            <TxtField
              className="flex-1"
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={user?.lastName || "Enter your last name"}
              variant="outline"
              size="sm"
            />
          </div>

          <TxtField
            className="flex-1"
            label="Phone number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder={user?.phoneNumber || "Enter your phone number"}
            variant="outline"
            size="md"
            type="tel"
          />
          <TxtField
            className="flex-1"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={user?.email || "Enter your phone number"}
            variant="outline"
            size="md"
            type="email"
          />

          <Select
            value={formData.gender ? String(formData.gender) : ""}
            onValueChange={(val) =>
              setFormData((p) => ({ ...p, gender: Number(val) }))
            }
          >
            <p className="text-sm font-medium space-y-2">Gender</p>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Gender</SelectLabel>
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          </div>
          {message && <p className="text-sm text-center">{message}</p>}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
