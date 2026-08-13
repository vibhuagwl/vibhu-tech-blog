import type {Metadata} from 'next';
import {Suspense} from 'react';
import EncryptionHub from '@/components/encryption/encryption-hub';
import {buildSpringEncryptionLabTree, listSpringEncryptionLabFiles} from '@/lib/spring-encryption-lab-source';

export const metadata: Metadata = {
  title: 'Encryption & Decryption in Spring Boot — Complete Production Guide',
  description:
    'Practical encryption guide for Java and Spring: AES-GCM, RSA, ECC, hybrid and envelope encryption, KMS, JWT, TLS, searchable fields, rotation, and interviews.',
};

export default function EncryptionPage() {
  const files = listSpringEncryptionLabFiles();
  const tree = buildSpringEncryptionLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('AesEncryptionService.java'))?.path
    ?? files.find((f) => f.path.includes('CryptoController.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading encryption guide...</div>}>
        <EncryptionHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
