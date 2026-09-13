import { redirect } from 'next/navigation';

export default function Home() {
  // কেউ মেইন লিংকে আসলেই সরাসরি লগইন পেজে চলে যাবে
  redirect('/login'); 
}