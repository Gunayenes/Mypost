-- İletişim formu mesajları için tablo
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactMessages')
BEGIN
    CREATE TABLE [ContactMessages] (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [FullName] NVARCHAR(200) NOT NULL,
        [Email] NVARCHAR(256) NOT NULL,
        [Phone] NVARCHAR(50) NULL,
        [BusinessName] NVARCHAR(200) NULL,
        [Subject] NVARCHAR(300) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [ReadAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_ContactMessages] PRIMARY KEY ([Id])
    );

    CREATE INDEX [IX_ContactMessages_CreatedAt] ON [ContactMessages]([CreatedAt]);
    CREATE INDEX [IX_ContactMessages_IsRead] ON [ContactMessages]([IsRead]);
END
