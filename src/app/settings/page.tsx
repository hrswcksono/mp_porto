'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  UserIcon, 
  LockIcon,
  BellIcon,
  PaletteIcon,
  GlobeIcon,
  ShieldIcon,
  SettingsIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    task_assigned: true,
    task_due: true,
    project_updates: true,
    comments: true,
    mentions: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    language: 'id',
    timezone: 'Asia/Jakarta',
    date_format: 'dd/MM/yyyy',
    time_format: '24h',
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile(),
  });

  useEffect(() => {
    if (user?.data) {
      setProfileForm({
        name: user.data.name || '',
        email: user.data.email || '',
        phone: user.data.phone || '',
        department: (user.data as any).department || '',
        bio: (user.data as any).bio || '',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      alert('Profil berhasil diperbarui');
    },
    onError: (error) => {
      alert('Gagal memperbarui profil: ' + getErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => userApi.changePassword(data),
    onSuccess: () => {
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      alert('Password berhasil diubah');
    },
    onError: (error) => {
      alert('Gagal mengubah password: ' + getErrorMessage(error));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      alert('Konfirmasi password tidak cocok');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleNotificationSave = () => {
    alert('Pengaturan notifikasi berhasil disimpan');
  };

  const handleAppearanceSave = () => {
    alert('Pengaturan tampilan berhasil disimpan');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: UserIcon },
    { id: 'password', label: 'Password', icon: LockIcon },
    { id: 'notifications', label: 'Notifikasi', icon: BellIcon },
    { id: 'appearance', label: 'Tampilan', icon: PaletteIcon },
    { id: 'privacy', label: 'Privasi', icon: ShieldIcon },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">Kelola akun dan preferensi Anda</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Profil</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departemen
                      </label>
                      <input
                        type="text"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ceritakan sedikit tentang diri Anda..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <SaveIcon className="h-5 w-5 mr-2" />
                    {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.password_confirmation}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <LockIcon className="h-5 w-5 mr-2" />
                    {changePasswordMutation.isPending ? 'Mengubah...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Notifikasi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Notifikasi Email</h4>
                        <p className="text-sm text-gray-500">Terima notifikasi melalui email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_notifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Terima notifikasi push di browser</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.push_notifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, push_notifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <hr className="my-4" />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Jenis Notifikasi</h4>
                      
                      {[
                        { key: 'task_assigned', label: 'Tugas Ditugaskan' },
                        { key: 'task_due', label: 'Deadline Tugas' },
                        { key: 'project_updates', label: 'Update Proyek' },
                        { key: 'comments', label: 'Komentar Baru' },
                        { key: 'mentions', label: 'Disebutkan' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                              onChange={(e) => setNotificationSettings({ 
                                ...notificationSettings, 
                                [item.key]: e.target.checked 
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNotificationSave}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <SaveIcon className="h-5 w-5 mr-2" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Tampilan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <select
                        value={appearanceSettings.theme}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Terang</option>
                        <option value="dark">Gelap</option>
                        <option value="auto">Otomatis</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bahasa
                      </label>
                      <select
                        value={appearanceSettings.language}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Waktu
                      </label>
                      <select
                        value={appearanceSettings.timezone}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Jakarta">WIB (Jakarta)</option>
                        <option value="Asia/Makassar">WITA (Makassar)</option>
                        <option value="Asia/Jayapura">WIT (Jayapura)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format Tanggal
                      </label>
                      <select
                        value={appearanceSettings.date_format}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, date_format: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                        <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format Waktu
                      </label>
                      <select
                        value={appearanceSettings.time_format}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, time_format: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="24h">24 Jam</option>
                        <option value="12h">12 Jam (AM/PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleAppearanceSave}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <SaveIcon className="h-5 w-5 mr-2" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Privasi</h3>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <ShieldIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">
                            Pengaturan Privasi
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Fitur pengaturan privasi akan segera tersedia. Saat ini semua data Anda dilindungi sesuai dengan kebijakan privasi perusahaan.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Profil Publik</h4>
                          <p className="text-sm text-gray-500">Izinkan anggota tim lain melihat profil Anda</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Status Online</h4>
                          <p className="text-sm text-gray-500">Tampilkan status online kepada anggota tim</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Aktivitas Terbaru</h4>
                          <p className="text-sm text-gray-500">Tampilkan aktivitas terbaru di profil</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                    <SaveIcon className="h-5 w-5 mr-2" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
