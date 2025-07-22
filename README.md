# Game Law Mistake

This is a multiplayer web game where players take on different roles to solve a crime.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## How to Play

### Game Objective
The goal of the game is for the **Criminal** to avoid being identified, and for the other players to successfully identify the Criminal and the "mistake" (false statement) made by another player.

### Roles

There are five possible roles, assigned randomly at the start of each game/round:

*   **القاضي (Judge)**: Knows two true pieces of information related to the crime.
*   **المحامي (Lawyer)**: Knows two true pieces of information related to the crime.
*   **الشاهد (Witness)**: Knows two true pieces of information related to the crime.
*   **المجرم (Criminal)**: Knows two true pieces of information related to the crime. Their goal is to blend in and mislead others.
*   **المزيف (Fake)**: (Optional, if there are enough players) Knows two true pieces of information related to the crime. Their objective might be to confuse or disrupt.

**Important**: Each player also receives one "mistake" (`mistake`) statement that is false.

### Game Flow and Events

1.  **Create or Join a Room**:
    *   Players start by creating a new room or joining an existing one using a unique room code.
    *   The room owner is the player who created the room.

2.  **Start the Game**:
    *   Only the room owner can start the game.
    *   Once started, roles (`role`), true information (`info`), and a false statement (`mistake`) are randomly assigned to each player.
    *   Players will see their assigned role, two pieces of "info", and their unique "mistake" statement.

3.  **Declaration Phase**:
    *   Each player takes turns declaring information.
    *   **Crucially, players must declare information concisely, related to the storyline, and avoid explicitly stating their innocence or making direct accusations.**
    *   The true information (`info`) and the false statement (`mistake`) are presented to players. Players should strategically use their true information and subtly integrate their false statement without giving it away.
    *   The sequence of these declarations, when put together, should reveal clues about who is innocent and who is the criminal [[memory:3974498]].

4.  **Voting for the Criminal**:
    *   After the declaration phase, a voting period begins.
    *   Players vote for who they believe is the **Criminal**.

5.  **Voting for the Mistake**:
    *   Following the criminal vote, players also vote to identify a **mistake** (the false statement) made by another player.

6.  **Round End and Scoring**:
    *   Points are awarded based on correct guesses.
    *   If the **Criminal** is successfully identified, the innocent players gain points.
    *   If a player's **mistake** is correctly identified, that player loses points (or the player who identified it gains points).
    *   The game can proceed to new rounds, where roles and information are reshuffled, but points are carried over.

7.  **Winning Conditions**:
    *   The game likely continues for a set number of rounds or until a certain point threshold is reached.
    *   The player with the most points at the end of the game wins. The criminal's objective is to avoid being caught and accumulate points by making others incorrectly guess their mistake or identity.

## كيف تلعب اللعبة - قصة تفاعلية

دعونا نروي قصة عن كيفية لعب "لعبة خطأ القانون" خطوة بخطوة، من وجهة نظر اللاعبين:

**1. البداية: إنشاء غرفة أو الانضمام إليها**

تخيل أن **أحمد** يريد اللعب مع أصدقائه. يفتح اللعبة ويختار "إنشاء غرفة". يحصل على رمز غرفة فريد، على سبيل المثال "XYZ123". يشارك أحمد هذا الرمز مع أصدقائه: **فاطمة**، **علي**، و**ليلى**. كل واحد منهم يدخل اللعبة ويختار "الانضمام إلى غرفة" ويدخل الرمز "XYZ123".

بمجرد انضمام الجميع، يظهر أحمد كـ"مالك الغرفة" (لأنه من أنشأها). يمكنهم الدردشة في الغرفة حتى يصبحوا جاهزين للبدء.

**2. بدء الجولة وتوزيع الأدوار**

عندما يكون الجميع مستعدًا، يضغط أحمد، مالك الغرفة، على زر "بدء اللعبة". في هذه اللحظة الحاسمة، توزع اللعبة الأدوار بشكل عشوائي:

*   قد يصبح **أحمد** "القاضي".
*   قد تصبح **فاطمة** "المحامي".
*   قد يصبح **علي** "المجرم" (وهو هدفه الآن ألا يتم كشفه!).
*   وقد تصبح **ليلى** "الشاهد".

يتلقى كل لاعب شاشته الخاصة التي تعرض دوره الجديد، بالإضافة إلى "بطاقتين معلومات" (حقائق صحيحة حول الجريمة) و"بطاقة خطأ" (معلومة خاطئة فريدة خاصة به).

**3. مرحلة التصريحات: الأدلة والتمويه**

تبدأ اللعبة، وتبدأ معها الإثارة! يبدأ كل لاعب بالترتيب في الإدلاء بتصريحاته. هنا تكمن المتعة:

*   يقول **أحمد (القاضي)**: "القاضي غادر المكتب قبل السرقة، والمحامي كان يتحدث في الهاتف وقت الجريمة." (هذه معلوماته الصحيحة).
*   تقول **فاطمة (المحامي)**: "المجرم كان يرتدي قميصًا أزرق، والشاهد رأى شخصًا يخرج مسرعًا." (معلوماتها الصحيحة).
*   يأتي دور **علي (المجرم)**. لديه معلومات صحيحة، لكن لديه أيضًا "معلومة الخطأ" الخاصة به التي يجب أن يحاول دمجها ببراعة دون أن يثير الشك. يقول علي: "الساعة سُرقت بعد انتهاء الاجتماع، والشاهد لم يرَ أحدًا." (هنا، 'الشاهد لم يرَ أحدًا' هي معلوماته الخاطئة، لكنه يقولها كأنها حقيقة).
*   أخيرًا، تقول **ليلى (الشاهد)**: "المحامي كان يتحدث في الهاتف وقت الجريمة، والقاضي كان في المكتب وقت السرقة." (معلوماتها الصحيحة).

الجميع يستمع بانتباه شديد. الهدف هو ربط التصريحات ببعضها البعض ومحاولة اكتشاف التناقضات أو المعلومات غير المنطقية. [[memory:3974498]]

**4. التصويت على المجرم**

بعد انتهاء جميع التصريحات، تبدأ مرحلة التصويت. يظهر أمام كل لاعب شاشة حيث يمكنه التصويت على اللاعب الذي يعتقد أنه **المجرم**.

*   تصوت **أحمد** على **علي**.
*   تصوت **فاطمة** على **علي**.
*   تصوت **ليلى** على **أحمد**.
*   يصوت **علي (المجرم)** على **أحمد** (محاولًا تضليلهم!).

**5. التصويت على الخطأ**

بعد التصويت على المجرم، تأتي مرحلة أخرى من التصويت: تحديد "الخطأ". يجب على كل لاعب أن يصوت على التصريح الخاطئ الذي يعتقد أن لاعبًا آخر أدلى به.

*   تصوت **أحمد** على "الشاهد لم يرَ أحدًا" (تصريح علي).
*   تصوت **فاطمة** على "القاضي كان في المكتب وقت السرقة" (تصريح ليلى).
*   وهكذا يستمر التصويت.

**6. نهاية الجولة وتجميع النقاط**

بعد اكتمال التصويت، تعرض اللعبة النتائج:
*   إذا تم التصويت على **علي** كـ"المجرم" من قبل الأغلبية، يكسب أحمد وفاطمة وليلى نقاطًا.
*   إذا تمكن لاعب من تحديد "معلومة الخطأ" التي أدلى بها علي، يكسب نقاطًا.
*   إذا لم يتم كشف علي، يكسب هو نقاطًا.

يتم تحديث النقاط لكل لاعب. يمكن لأحمد، مالك الغرفة، أن يختار "بدء جولة جديدة". في الجولة الجديدة، يتم إعادة توزيع الأدوار والمعلومات والخطأ عشوائيًا (لكن النقاط تظل كما هي)، وتبدأ اللعبة من جديد، مما يضيف عمقًا وتحديًا أكبر!

**الفوز في اللعبة**: تستمر اللعبة لجولات متعددة. اللاعب الذي يجمع أكبر عدد من النقاط في نهاية اللعبة هو الفائز. يهدف المجرم إلى الخروج من اللعبة دون أن يتم كشفه وجمع النقاط من خلال إرباك الآخرين وجعلهم يخطئون في التخمين.
